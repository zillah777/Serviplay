import nodemailer from 'nodemailer';
import { createError } from '@/middleware/errorHandler';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"Serviplay" <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        html,
      });
      
      console.log(`✅ Email enviado a ${to}: ${subject}`);
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      throw createError('Error enviando email', 500);
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Inter', sans-serif; background: #f8fafc; padding: 40px 20px;">
        <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="color: white; font-size: 24px; font-weight: bold;">S</span>
            </div>
            <h1 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 0;">¡Bienvenido/a a Serviplay!</h1>
          </div>

          <!-- Content -->
          <div style="margin-bottom: 40px;">
            <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Gracias por registrarte en Serviplay, la plataforma que conecta Ases y Exploradores.
            </p>
            <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Para completar tu registro y comenzar a usar todas las funcionalidades, necesitás verificar tu email:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="display: inline-block; background: #2563eb; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; transition: all 0.3s;">
                Verificar mi email
              </a>
            </div>
            
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; margin-top: 30px;">
              Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br>
              <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
            </p>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 30px; text-align: center;">
            <p style="color: #94a3b8; font-size: 14px; margin: 0 0 10px 0;">
              Este enlace expira en 24 horas por seguridad.
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © 2024 Serviplay. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    `;

    await this.sendEmail(email, 'Verificá tu email - Serviplay', html);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Inter', sans-serif; background: #f8fafc; padding: 40px 20px;">
        <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="width: 60px; height: 60px; background: #ef4444; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="color: white; font-size: 24px;">🔐</span>
            </div>
            <h1 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 0;">Recuperar contraseña</h1>
          </div>

          <!-- Content -->
          <div style="margin-bottom: 40px;">
            <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta en Serviplay.
            </p>
            <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Si fuiste vos quien hizo esta solicitud, hacé clic en el botón de abajo para crear una nueva contraseña:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; background: #ef4444; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Restablecer contraseña
              </a>
            </div>
            
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; margin-top: 30px;">
              Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br>
              <a href="${resetUrl}" style="color: #ef4444; word-break: break-all;">${resetUrl}</a>
            </p>

            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-top: 30px;">
              <p style="color: #991b1b; font-size: 14px; margin: 0; font-weight: 500;">
                ⚠️ Si no solicitaste este cambio, podés ignorar este email. Tu contraseña no será modificada.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 30px; text-align: center;">
            <p style="color: #94a3b8; font-size: 14px; margin: 0 0 10px 0;">
              Este enlace expira en 1 hora por seguridad.
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © 2024 Serviplay. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    `;

    await this.sendEmail(email, 'Restablecer contraseña - Serviplay', html);
  }

  async sendWelcomeEmail(email: string, nombre: string, tipo_usuario: string): Promise<void> {
    const isAs = tipo_usuario === 'as' || tipo_usuario === 'ambos';
    const isExplorador = tipo_usuario === 'explorador' || tipo_usuario === 'ambos';
    
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Inter', sans-serif; background: #f8fafc; padding: 40px 20px;">
        <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="color: white; font-size: 24px; font-weight: bold;">S</span>
            </div>
            <h1 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 0;">
              ¡Hola ${nombre}! 👋
            </h1>
            <p style="color: #2563eb; font-size: 18px; font-weight: 600; margin: 10px 0 0 0;">
              ${isAs ? '¡Sos oficialmente un As de Serviplay! 🌟' : '¡Bienvenido/a al equipo de Exploradores! 🔍'}
            </p>
          </div>

          <!-- Content -->
          <div style="margin-bottom: 40px;">
            <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Tu cuenta ya está verificada y lista para usar. 
              ${isAs ? 'Ahora podés empezar a ofrecer tus servicios y conectar con Exploradores que necesitan tu expertise.' : 'Ahora podés explorar todos los servicios disponibles y encontrar a los mejores Ases cerca tuyo.'}
            </p>

            <!-- Next Steps -->
            <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
              <h3 style="color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
                Próximos pasos:
              </h3>
              <ul style="color: #64748b; margin: 0; padding-left: 20px;">
                ${isAs ? `
                  <li style="margin-bottom: 8px;">Completá tu perfil con fotos y más información</li>
                  <li style="margin-bottom: 8px;">Creá tus primeros servicios</li>
                  <li style="margin-bottom: 8px;">Verificá tu identidad para generar más confianza</li>
                  <li>¡Empezá a recibir solicitudes de Exploradores!</li>
                ` : `
                  <li style="margin-bottom: 8px;">Explorá servicios en tu zona</li>
                  <li style="margin-bottom: 8px;">Usá los filtros para encontrar exactamente lo que necesitás</li>
                  <li style="margin-bottom: 8px;">Contactá directamente con los Ases</li>
                  <li>¡Dejá calificaciones para ayudar a otros Exploradores!</li>
                `}
              </ul>
            </div>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/dashboard" 
                 style="display: inline-block; background: #2563eb; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Ir a mi panel
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 30px; text-align: center;">
            <p style="color: #94a3b8; font-size: 14px; margin: 0 0 10px 0;">
              ¿Necesitás ayuda? Contactanos en hola@serviplay.com
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © 2024 Serviplay. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    `;

    await this.sendEmail(email, `¡Bienvenido/a a Serviplay, ${nombre}!`, html);
  }
}

export default new EmailService();