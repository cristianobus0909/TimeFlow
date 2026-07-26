import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';

// Force Google DNS servers to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Load environment variables from the current working directory
dotenv.config({ path: path.join(process.cwd(), '.env') });

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('❌ MONGO_URI no encontrada en el archivo .env');
  process.exit(1);
}

async function run() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(mongoUri!);
    console.log('✅ Conectado con éxito.');

    console.log('🧹 Eliminando tokens de actualización (sesiones) de todos los usuarios...');
    if (!mongoose.connection.db) {
      throw new Error('La conexión a la base de datos no está activa.');
    }
    const result = await mongoose.connection.db.collection('users').updateMany(
      {},
      { $set: { refreshToken: null } }
    );

    console.log(`🎉 ¡Operación completada! Se cerraron las sesiones de ${result.modifiedCount} usuarios.`);
  } catch (error) {
    console.error('❌ Error al vaciar las sesiones:', error);
  } finally {
    await mongoose.disconnect();
    console.log('ℹ️ Conexión cerrada.');
    process.exit(0);
  }
}

run();
