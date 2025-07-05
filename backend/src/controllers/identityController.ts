import { Request, Response } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';
import nodemailer from 'nodemailer';

export class IdentityController {
  
  /**
   * Submit identity verification documents
   * POST /api/identity/submit-documents
   */
  static async submitDocuments(req: Request, res: Response) {
    const transaction = await pool.connect();
    
    try {
      await transaction.query('BEGIN');
      
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      const { 
        document_type, 
        document_front_file_id, 
        document_back_file_id,
        notes 
      } = req.body;

      // Validate required fields
      if (!document_type || !document_front_file_id) {
        return res.status(400).json({
          success: false,
          error: 'Tipo de documento y foto frontal son requeridos'
        });
      }

      // Verify files exist and belong to user
      const frontFileResult = await transaction.query(
        'SELECT * FROM file_uploads WHERE id = $1 AND status = $2',
        [document_front_file_id, 'active']
      );

      if (frontFileResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Archivo frontal no encontrado o inválido'
        });
      }

      let backFileValid = true;
      if (document_back_file_id) {
        const backFileResult = await transaction.query(
          'SELECT * FROM file_uploads WHERE id = $1 AND status = $2',
          [document_back_file_id, 'active']
        );
        
        if (backFileResult.rows.length === 0) {
          backFileValid = false;
        }
      }

      if (!backFileValid) {
        return res.status(400).json({
          success: false,
          error: 'Archivo posterior no encontrado o inválido'
        });
      }

      // Get user profile to update
      const userResult = await transaction.query(
        'SELECT tipo_usuario FROM usuarios WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      const userType = userResult.rows[0].tipo_usuario;
      
      // Update appropriate profile table
      let tableName = userType === 'as' ? 'perfiles_ases' : 'perfiles_exploradores';
      
      // Check if profile exists
      const profileResult = await transaction.query(
        `SELECT * FROM ${tableName} WHERE usuario_id = $1`,
        [userId]
      );

      if (profileResult.rows.length === 0) {
        // Create profile if it doesn't exist
        await transaction.query(
          `INSERT INTO ${tableName} (usuario_id, created_at, updated_at) VALUES ($1, NOW(), NOW())`,
          [userId]
        );
      }

      // Update verification documents
      const updateQuery = `
        UPDATE ${tableName} 
        SET 
          foto_dni_frente = $1,
          foto_dni_dorso = $2,
          tipo_documento = $3,
          notas_verificacion = $4,
          estado_verificacion = 'pending',
          fecha_solicitud_verificacion = NOW(),
          updated_at = NOW()
        WHERE usuario_id = $5
      `;

      await transaction.query(updateQuery, [
        document_front_file_id,
        document_back_file_id || null,
        document_type,
        notes || null,
        userId
      ]);

      // Associate files with verification context
      await transaction.query(
        'UPDATE file_uploads SET context = $1, entity_id = $2 WHERE id = $3',
        ['identity_verification', userId, document_front_file_id]
      );

      if (document_back_file_id) {
        await transaction.query(
          'UPDATE file_uploads SET context = $1, entity_id = $2 WHERE id = $3',
          ['identity_verification', userId, document_back_file_id]
        );
      }

      // Create verification history record
      await transaction.query(
        `INSERT INTO verification_history 
         (usuario_id, tipo_verificacion, estado, fecha_solicitud, documentos_subidos, notas)
         VALUES ($1, 'identity', 'pending', NOW(), $2, $3)`,
        [
          userId, 
          JSON.stringify({
            front: document_front_file_id,
            back: document_back_file_id,
            type: document_type
          }),
          notes
        ]
      );

      await transaction.query('COMMIT');

      // Send notification email (async, don't wait for it)
      IdentityController.sendVerificationNotification(userId, 'submitted').catch(console.error);

      res.json({
        success: true,
        message: 'Documentos enviados para verificación correctamente',
        data: {
          status: 'pending',
          submitted_at: new Date().toISOString()
        }
      });

    } catch (error) {
      await transaction.query('ROLLBACK');
      console.error('Error submitting identity documents:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    } finally {
      transaction.release();
    }
  }

  /**
   * Get identity verification status
   * GET /api/identity/status
   */
  static async getVerificationStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
      }

      // Get user type
      const userResult = await pool.query(
        'SELECT tipo_usuario FROM usuarios WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      const userType = userResult.rows[0].tipo_usuario;
      const tableName = userType === 'as' ? 'perfiles_ases' : 'perfiles_exploradores';

      // Get verification status
      const statusResult = await pool.query(
        `SELECT 
          identidad_verificada,
          estado_verificacion,
          fecha_verificacion,
          fecha_solicitud_verificacion,
          notas_verificacion,
          notas_rechazo,
          tipo_documento,
          foto_dni_frente,
          foto_dni_dorso
        FROM ${tableName} 
        WHERE usuario_id = $1`,
        [userId]
      );

      let verificationData = null;
      if (statusResult.rows.length > 0) {
        const profile = statusResult.rows[0];
        verificationData = {
          is_verified: profile.identidad_verificada || false,
          status: profile.estado_verificacion || 'not_started',
          verified_at: profile.fecha_verificacion,
          submitted_at: profile.fecha_solicitud_verificacion,
          document_type: profile.tipo_documento,
          has_documents: !!(profile.foto_dni_frente),
          notes: profile.notas_verificacion,
          rejection_reason: profile.notas_rechazo
        };
      } else {
        verificationData = {
          is_verified: false,
          status: 'not_started',
          verified_at: null,
          submitted_at: null,
          document_type: null,
          has_documents: false,
          notes: null,
          rejection_reason: null
        };
      }

      // Get verification history
      const historyResult = await pool.query(
        `SELECT estado, fecha_solicitud, fecha_actualizacion, notas
         FROM verification_history 
         WHERE usuario_id = $1 AND tipo_verificacion = 'identity'
         ORDER BY fecha_solicitud DESC
         LIMIT 10`,
        [userId]
      );

      res.json({
        success: true,
        data: {
          verification: verificationData,
          history: historyResult.rows
        }
      });

    } catch (error) {
      console.error('Error getting verification status:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * Update verification status (Admin only)
   * PUT /api/identity/update-status
   */
  static async updateVerificationStatus(req: Request, res: Response) {
    const transaction = await pool.connect();
    
    try {
      await transaction.query('BEGIN');

      const adminUserId = (req as any).user?.id;
      const { user_id, status, notes, rejection_reason } = req.body;

      // Verify admin permissions
      const adminResult = await transaction.query(
        'SELECT rol FROM usuarios WHERE id = $1',
        [adminUserId]
      );

      if (adminResult.rows.length === 0 || adminResult.rows[0].rol !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Permisos insuficientes'
        });
      }

      // Validate status
      if (!['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Estado de verificación inválido'
        });
      }

      // Get user type
      const userResult = await transaction.query(
        'SELECT tipo_usuario FROM usuarios WHERE id = $1',
        [user_id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      const userType = userResult.rows[0].tipo_usuario;
      const tableName = userType === 'as' ? 'perfiles_ases' : 'perfiles_exploradores';

      // Update verification status
      const updateFields = [
        'estado_verificacion = $1',
        'updated_at = NOW()'
      ];
      const updateValues = [status];
      let paramCount = 1;

      if (status === 'approved') {
        updateFields.push(`identidad_verificada = $${++paramCount}`);
        updateFields.push(`fecha_verificacion = $${++paramCount}`);
        updateValues.push(true, new Date());
      } else if (status === 'rejected') {
        updateFields.push(`identidad_verificada = $${++paramCount}`);
        updateFields.push(`notas_rechazo = $${++paramCount}`);
        updateValues.push(false, rejection_reason);
      }

      if (notes) {
        updateFields.push(`notas_verificacion = $${++paramCount}`);
        updateValues.push(notes);
      }

      updateValues.push(user_id);

      const updateQuery = `
        UPDATE ${tableName} 
        SET ${updateFields.join(', ')}
        WHERE usuario_id = $${updateValues.length}
      `;

      await transaction.query(updateQuery, updateValues);

      // Update verification history
      await transaction.query(
        `UPDATE verification_history 
         SET estado = $1, fecha_actualizacion = NOW(), notas = $2
         WHERE usuario_id = $3 AND tipo_verificacion = 'identity'
         AND fecha_actualizacion IS NULL`,
        [status, notes || rejection_reason, user_id]
      );

      await transaction.query('COMMIT');

      // Send notification to user
      IdentityController.sendVerificationNotification(user_id, status, rejection_reason).catch(console.error);

      res.json({
        success: true,
        message: `Verificación ${status === 'approved' ? 'aprobada' : status === 'rejected' ? 'rechazada' : 'actualizada'} correctamente`
      });

    } catch (error) {
      await transaction.query('ROLLBACK');
      console.error('Error updating verification status:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    } finally {
      transaction.release();
    }
  }

  /**
   * Get pending verifications for admin review
   * GET /api/identity/pending
   */
  static async getPendingVerifications(req: Request, res: Response) {
    try {
      const adminUserId = (req as any).user?.id;

      // Verify admin permissions
      const adminResult = await pool.query(
        'SELECT rol FROM usuarios WHERE id = $1',
        [adminUserId]
      );

      if (adminResult.rows.length === 0 || adminResult.rows[0].rol !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Permisos insuficientes'
        });
      }

      // Get pending verifications from both profile tables
      const pendingQuery = `
        SELECT 
          u.id as user_id,
          u.email,
          u.tipo_usuario,
          p.fecha_solicitud_verificacion,
          p.tipo_documento,
          p.notas_verificacion,
          p.foto_dni_frente,
          p.foto_dni_dorso,
          COALESCE(pa.nombre, pe.nombre, u.nombre) as nombre,
          COALESCE(pa.apellido, pe.apellido, u.apellido) as apellido
        FROM usuarios u
        LEFT JOIN perfiles_ases pa ON u.id = pa.usuario_id AND u.tipo_usuario = 'as'
        LEFT JOIN perfiles_exploradores pe ON u.id = pe.usuario_id AND u.tipo_usuario = 'explorador'
        LEFT JOIN (
          SELECT usuario_id, fecha_solicitud_verificacion, tipo_documento, notas_verificacion, 
                 foto_dni_frente, foto_dni_dorso, 'as' as profile_type
          FROM perfiles_ases 
          WHERE estado_verificacion = 'pending'
          UNION ALL
          SELECT usuario_id, fecha_solicitud_verificacion, tipo_documento, notas_verificacion,
                 foto_dni_frente, foto_dni_dorso, 'explorador' as profile_type
          FROM perfiles_exploradores 
          WHERE estado_verificacion = 'pending'
        ) p ON u.id = p.usuario_id
        WHERE p.usuario_id IS NOT NULL
        ORDER BY p.fecha_solicitud_verificacion ASC
      `;

      const result = await pool.query(pendingQuery);

      // Get file URLs for documents
      const verifications = await Promise.all(
        result.rows.map(async (row) => {
          const documents = [];
          
          if (row.foto_dni_frente) {
            const frontFile = await pool.query(
              'SELECT file_url, original_name FROM file_uploads WHERE id = $1',
              [row.foto_dni_frente]
            );
            if (frontFile.rows.length > 0) {
              documents.push({
                type: 'front',
                url: frontFile.rows[0].file_url,
                name: frontFile.rows[0].original_name
              });
            }
          }

          if (row.foto_dni_dorso) {
            const backFile = await pool.query(
              'SELECT file_url, original_name FROM file_uploads WHERE id = $1',
              [row.foto_dni_dorso]
            );
            if (backFile.rows.length > 0) {
              documents.push({
                type: 'back',
                url: backFile.rows[0].file_url,
                name: backFile.rows[0].original_name
              });
            }
          }

          return {
            user_id: row.user_id,
            email: row.email,
            user_type: row.tipo_usuario,
            full_name: `${row.nombre || ''} ${row.apellido || ''}`.trim(),
            submitted_at: row.fecha_solicitud_verificacion,
            document_type: row.tipo_documento,
            notes: row.notas_verificacion,
            documents
          };
        })
      );

      res.json({
        success: true,
        data: {
          pending_verifications: verifications,
          total: verifications.length
        }
      });

    } catch (error) {
      console.error('Error getting pending verifications:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * Send verification notification email
   */
  private static async sendVerificationNotification(userId: string, status: string, rejectionReason?: string) {
    try {
      // Get user email
      const userResult = await pool.query(
        'SELECT email, nombre, apellido FROM usuarios WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return;
      }

      const user = userResult.rows[0];
      const fullName = `${user.nombre || ''} ${user.apellido || ''}`.trim() || user.email;

      // Create transporter (configure with your email service)
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      let subject = '';
      let text = '';
      let html = '';

      switch (status) {
        case 'submitted':
          subject = 'Documentos de verificación recibidos - Fixia';
          text = `Hola ${fullName},\n\nHemos recibido tus documentos de verificación de identidad. Nuestro equipo los revisará en las próximas 24-48 horas.\n\nTe notificaremos por email cuando la verificación esté completa.\n\nGracias,\nEquipo Fixia`;
          html = `
            <h2>Documentos recibidos</h2>
            <p>Hola ${fullName},</p>
            <p>Hemos recibido tus documentos de verificación de identidad. Nuestro equipo los revisará en las próximas <strong>24-48 horas</strong>.</p>
            <p>Te notificaremos por email cuando la verificación esté completa.</p>
            <p>Gracias,<br>Equipo Fixia</p>
          `;
          break;

        case 'approved':
          subject = '¡Verificación aprobada! - Fixia';
          text = `¡Felicitaciones ${fullName}!\n\nTu identidad ha sido verificada exitosamente. Ahora tendrás acceso a:\n\n- Badge de verificado en tu perfil\n- Mayor visibilidad en las búsquedas\n- Mayor confianza de los clientes\n\n¡Comienza a aprovechar todos los beneficios!\n\nEquipo Fixia`;
          html = `
            <h2>¡Verificación aprobada!</h2>
            <p>¡Felicitaciones ${fullName}!</p>
            <p>Tu identidad ha sido verificada exitosamente. Ahora tendrás acceso a:</p>
            <ul>
              <li>Badge de verificado en tu perfil</li>
              <li>Mayor visibilidad en las búsquedas</li>
              <li>Mayor confianza de los clientes</li>
            </ul>
            <p><strong>¡Comienza a aprovechar todos los beneficios!</strong></p>
            <p>Equipo Fixia</p>
          `;
          break;

        case 'rejected':
          subject = 'Verificación requiere atención - Fixia';
          text = `Hola ${fullName},\n\nHemos revisado tus documentos de verificación, pero necesitamos que revises algunos detalles.\n\nMotivo: ${rejectionReason}\n\nPuedes volver a enviar tus documentos desde tu perfil.\n\nSi tienes dudas, contacta nuestro soporte.\n\nEquipo Fixia`;
          html = `
            <h2>Verificación requiere atención</h2>
            <p>Hola ${fullName},</p>
            <p>Hemos revisado tus documentos de verificación, pero necesitamos que revises algunos detalles.</p>
            <p><strong>Motivo:</strong> ${rejectionReason}</p>
            <p>Puedes volver a enviar tus documentos desde tu perfil.</p>
            <p>Si tienes dudas, contacta nuestro soporte.</p>
            <p>Equipo Fixia</p>
          `;
          break;
      }

      await transporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@fixia.com',
        to: user.email,
        subject,
        text,
        html
      });

    } catch (error) {
      console.error('Error sending verification notification:', error);
    }
  }
}