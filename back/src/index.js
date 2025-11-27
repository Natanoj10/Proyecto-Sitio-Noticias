import express from 'express';
import dotenv from 'dotenv';
import { connectToMongo } from './config/db.config.js';
import { connectToRedis } from './config/redis.config.js';
import { initCassandra } from './logger/logger.cassandra.js';

// Importación de rutas
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/userauth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import setupRoutes from './routes/setup.routes.js'; // ← NUEVA RUTA

import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 3000; 

// Middleware CORS
app.use(cors({
    origin: '*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));

app.use(express.json());
app.set('etag', false);

// Montar Rutas
app.use('/api/auth', authRoutes); 
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/setup', setupRoutes); // ← RUTA DE CONFIGURACIÓN INICIAL

// Función para iniciar el servidor
async function run() {
  try {
    await connectToMongo();
    console.log('📦 MongoDB conectado');
    
    await connectToRedis();
    console.log('🔴 Redis conectado');

    await initCassandra();
    console.log('📗 Cassandra inicializada');

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch(error) {
    console.log("Falló el arranque de los servidores", error);
    process.exit(1);
  }
}

run();





// Auth.js
// Renderizado condicional
// Server side renderization
// Telemetria
// Firmware


































// import { connectToMongo, disconnect } from "./config/db.config.js";
// import { connectToRedis } from './config/redis.config.js'; 

// import express from 'express';
// import { getStudents, getStudents1, postStudents, putStudents, deleteStudents } from "./controllers/student.controller.js";
// // ### De esto ###
// // const PORT = 3000;
// // ### A esto ###
// const PORT = 3000;
// // Ruta para consumir un servisio en especifico
// // dominio clave valor, el dns checa el dominio y ver las ips relacionadas a este
// const app =  express();
// app.use(express.json())
// app.get('/', (request, response) => {
//     response.send({
//         message: 'Hola'
//     });
// });

// app.get('/students', getStudents);
// app.get('/students1', getStudents1);
// app.post('/students', postStudents)
// app.put('/students/:id', putStudents)
// app.delete('/students/:id', deleteStudents)
// async function run(){
//     try{
//         await connectToMongo();
//         await connectToRedis();
//         app.listen(PORT, "0.0.0.0", () => {
//         console.log(`Servidor escuchando en http://localhost:${PORT}`);
//         });
//     }catch(error){
//         console.log("Falló el arranque de los servidores",error);
//         process.exit(1);
//     }

// }

// run();

// async function  main() {
//     await connect();

//     const student = await create({
//         name:"Pepe Rodriguez",
//         birthdate: new Date("1900-01-01"),
//         email:"pepe@nose.com"
//     }) 
//     // console.log(`Estudiantes:\n ${await get()}`);
    
//     await disconnect();  

// }
// main();


//  CLASE PROMESAS
// // Programación Asincrona

// async function asynfunction () {
//     const promise =  new Promise((resolve, reject) =>{
//         setTimeout(() => {
//             resolve("Holaaaa");
//         }, 2000)
//     })
//     const result = await promise;
//     const otro = result+" Mundo"
//     console.log(otro)


// }

// asynfunction();

// // console.log(asynfunction());

// console.log("Depués de una funcion asincrona");

