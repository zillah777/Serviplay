import Joi from 'joi';

// Schemas de validación
export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email inválido',
    'any.required': 'Email es requerido'
  }),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required().messages({
    'string.min': 'La contraseña debe tener al menos 8 caracteres',
    'string.pattern.base': 'La contraseña debe contener al menos: una minúscula, una mayúscula, un número y un símbolo',
    'any.required': 'Contraseña es requerida'
  }),
  tipo_usuario: Joi.string().valid('as', 'explorador', 'ambos').required().messages({
    'any.only': 'Tipo de usuario debe ser: as, explorador o ambos',
    'any.required': 'Tipo de usuario es requerido'
  }),
  nombre: Joi.string().min(2).max(100).required().messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'string.max': 'El nombre no puede exceder 100 caracteres',
    'any.required': 'Nombre es requerido'
  }),
  apellido: Joi.string().min(2).max(100).required().messages({
    'string.min': 'El apellido debe tener al menos 2 caracteres',
    'string.max': 'El apellido no puede exceder 100 caracteres',
    'any.required': 'Apellido es requerido'
  }),
  dni: Joi.string().min(7).max(20).required().messages({
    'string.min': 'DNI inválido',
    'string.max': 'DNI inválido',
    'any.required': 'DNI es requerido'
  }),
  telefono: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required().messages({
    'string.pattern.base': 'Teléfono inválido',
    'any.required': 'Teléfono es requerido'
  }),
  fecha_nacimiento: Joi.date().max('now').iso().when('tipo_usuario', {
    is: Joi.string().valid('as', 'ambos'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }).messages({
    'date.max': 'Fecha de nacimiento inválida',
    'any.required': 'Fecha de nacimiento es requerida para Ases'
  }),
  direccion: Joi.string().min(10).max(500).required().messages({
    'string.min': 'La dirección debe ser más específica',
    'string.max': 'La dirección es demasiado larga',
    'any.required': 'Dirección es requerida'
  }),
  localidad: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Localidad inválida',
    'any.required': 'Localidad es requerida'
  }),
  provincia: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Provincia inválida',
    'any.required': 'Provincia es requerida'
  }),
  codigo_postal: Joi.string().min(4).max(10).optional(),
  latitud: Joi.number().min(-90).max(90).optional(),
  longitud: Joi.number().min(-180).max(180).optional(),
  
  // Campos específicos para Ases
  nivel_educativo: Joi.string().valid('primario', 'secundario', 'terciario', 'universitario', 'posgrado').when('tipo_usuario', {
    is: Joi.string().valid('as', 'ambos'),
    then: Joi.optional(),
    otherwise: Joi.forbidden()
  }),
  referencias_laborales: Joi.string().max(1000).optional(),
  tiene_movilidad: Joi.boolean().default(false),
  
  // Términos y condiciones
  acepta_terminos: Joi.boolean().valid(true).required().messages({
    'any.only': 'Debes aceptar los términos y condiciones'
  })
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email inválido',
    'any.required': 'Email es requerido'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Contraseña es requerida'
  }),
  remember_me: Joi.boolean().default(false)
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email inválido',
    'any.required': 'Email es requerido'
  })
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Token es requerido'
  }),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required().messages({
    'string.min': 'La contraseña debe tener al menos 8 caracteres',
    'string.pattern.base': 'La contraseña debe contener al menos: una minúscula, una mayúscula, un número y un símbolo',
    'any.required': 'Contraseña es requerida'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Las contraseñas no coinciden',
    'any.required': 'Confirmación de contraseña es requerida'
  })
});

export const verifyEmailSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Token de verificación es requerido'
  })
});

// Schema para crear calificación
export const createReviewSchema = Joi.object({
  match_id: Joi.string().uuid().required().messages({
    'string.uuid': 'ID de match inválido',
    'any.required': 'ID de match es requerido'
  }),
  calificado_id: Joi.string().uuid().required().messages({
    'string.uuid': 'ID de usuario calificado inválido',
    'any.required': 'ID de usuario calificado es requerido'
  }),
  puntuacion: Joi.number().integer().min(1).max(5).required().messages({
    'number.min': 'La puntuación debe ser mínimo 1',
    'number.max': 'La puntuación debe ser máximo 5',
    'any.required': 'Puntuación es requerida'
  }),
  comentario: Joi.string().max(1500).optional().messages({
    'string.max': 'El comentario no puede exceder 1500 caracteres'
  }),
  puntualidad: Joi.number().integer().min(1).max(5).required().messages({
    'number.min': 'La puntualidad debe ser mínimo 1',
    'number.max': 'La puntualidad debe ser máximo 5',
    'any.required': 'Puntualidad es requerida'
  }),
  calidad: Joi.number().integer().min(1).max(5).required().messages({
    'number.min': 'La calidad debe ser mínimo 1',
    'number.max': 'La calidad debe ser máximo 5',
    'any.required': 'Calidad es requerida'
  }),
  comunicacion: Joi.number().integer().min(1).max(5).required().messages({
    'number.min': 'La comunicación debe ser mínimo 1',
    'number.max': 'La comunicación debe ser máximo 5',
    'any.required': 'Comunicación es requerida'
  }),
  precio_justo: Joi.number().integer().min(1).max(5).required().messages({
    'number.min': 'Precio justo debe ser mínimo 1',
    'number.max': 'Precio justo debe ser máximo 5',
    'any.required': 'Precio justo es requerido'
  }),
  publica: Joi.boolean().default(true)
});

// Schema para actualizar calificación
export const updateReviewSchema = Joi.object({
  puntuacion: Joi.number().integer().min(1).max(5).optional().messages({
    'number.min': 'La puntuación debe ser mínimo 1',
    'number.max': 'La puntuación debe ser máximo 5'
  }),
  comentario: Joi.string().max(1500).optional().allow('').messages({
    'string.max': 'El comentario no puede exceder 1500 caracteres'
  }),
  puntualidad: Joi.number().integer().min(1).max(5).optional().messages({
    'number.min': 'La puntualidad debe ser mínimo 1',
    'number.max': 'La puntualidad debe ser máximo 5'
  }),
  calidad: Joi.number().integer().min(1).max(5).optional().messages({
    'number.min': 'La calidad debe ser mínimo 1',
    'number.max': 'La calidad debe ser máximo 5'
  }),
  comunicacion: Joi.number().integer().min(1).max(5).optional().messages({
    'number.min': 'La comunicación debe ser mínimo 1',
    'number.max': 'La comunicación debe ser máximo 5'
  }),
  precio_justo: Joi.number().integer().min(1).max(5).optional().messages({
    'number.min': 'Precio justo debe ser mínimo 1',
    'number.max': 'Precio justo debe ser máximo 5'
  }),
  publica: Joi.boolean().optional()
});

// Schema para reportar calificación
export const reportReviewSchema = Joi.object({
  razon: Joi.string().min(10).max(500).required().messages({
    'string.min': 'La razón debe tener al menos 10 caracteres',
    'string.max': 'La razón no puede exceder 500 caracteres',
    'any.required': 'Razón del reporte es requerida'
  })
});

// Validador de UUID
export const validateUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Validador general
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        errors
      });
    }
    
    next();
  };
};