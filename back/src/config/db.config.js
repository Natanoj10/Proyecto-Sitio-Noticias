import mongoose from "mongoose";
// Exportar la función como modulo, nos regresará una promesa que indica que se conecto exitosamente
export async function  connectToMongo(){
    const { MONGO_USER, MONGO_PASS, MONGO_HOST, MONGO_PORT, MONGO_DB} = process.env; // Extrae la variables de entirno
    // const uri = `mongodb://$(MONGO_USER):${encodeURIComponent(MONGO_PASS)}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;
    // Código corregido:
    const uri = `mongodb://${MONGO_USER}:${encodeURIComponent(MONGO_PASS)}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;
    try{
        await mongoose.connect(uri);
        console.log(`Conectado a MongoDB en ${uri}`);
        
    }catch(error){
        console.log("Error de conexión a MongoDB");
        console.log(`Error: ${error.message}`);
        process.exit(1);
    }
}

export async function disconnect() {
    await mongoose.disconnect();
    console.log("Desconectado de MongoDB");
}