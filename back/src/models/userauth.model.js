import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'El email es obligatorio.'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+@.+\..+/, 'Por favor, introduce un email válido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria.'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres.']
  },
  role: {
    type: String,
    // [EDITADO] Se incluye 'editor' como rol válido
    enum: ['user', 'admin', 'editor'], 
    default: 'user'
  }
}, {
  timestamps: true // Añade campos createdAt y updatedAt
});

// CRÍTICO: Pre-save hook para hashear la contraseña
// Se ejecuta ANTES de guardar el documento en la base de datos
UserSchema.pre('save', async function(next) {
  // Solo hashea si la contraseña ha sido modificada (o es nueva)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generar el salt y hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar la contraseña ingresada con la hasheada
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', UserSchema);

export default User;