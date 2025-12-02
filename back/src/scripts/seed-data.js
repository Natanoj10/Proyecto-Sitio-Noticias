import { connectToMongo } from '../config/db.config.js';
import { connectToRedis } from '../config/redis.config.js';
import User from '../models/userauth.model.js';
import News from '../models/news.model.js';

const mockUsers = [
    {
        email: 'admin@periodico.com',
        password: 'admin123',
        role: 'admin'
    },
    {
        email: 'editor1@periodico.com',
        password: 'editor123',
        role: 'editor'
    },
    {
        email: 'editor2@periodico.com',
        password: 'editor123',
        role: 'editor'
    },
    {
        email: 'usuario1@correo.com',
        password: 'user123',
        role: 'user'
    },
    {
        email: 'usuario2@correo.com',
        password: 'user123',
        role: 'user'
    }
];

const mockNews = [
    {
        title: '🚀 Lanzamiento Histórico: Nueva Misión Espacial a Marte',
        summary: 'La agencia espacial anuncia el lanzamiento de una nueva misión tripulada al planeta rojo programada para 2026.',
        content: 'En un anuncio histórico, la agencia espacial internacional ha confirmado el lanzamiento de una nueva misión tripulada a Marte para el año 2026. Esta misión representa un hito crucial en la exploración espacial humana.\n\nEl proyecto incluye una tripulación de seis astronautas altamente capacitados que pasarán 18 meses en el planeta rojo, realizando investigaciones científicas y estableciendo una base permanente.\n\nLos objetivos principales incluyen:\n- Búsqueda de evidencia de vida pasada o presente\n- Estudios geológicos del suelo marciano\n- Pruebas de tecnologías para futuras colonias\n- Producción de oxígeno y combustible in-situ\n\nEl presupuesto estimado es de 50 mil millones de dólares, financiado por una coalición de países y empresas privadas.',
        category: 'tecnología',
        imageUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=800',
        published: true
    },
    {
        title: '⚽ Mundial 2026: Todo lo que necesitas saber sobre la Copa del Mundo',
        summary: 'Prepárate para el evento deportivo más grande del planeta con nuestra guía completa.',
        content: 'El Mundial de Fútbol 2026 será histórico por múltiples razones. Por primera vez, el torneo se llevará a cabo en tres países: Estados Unidos, México y Canadá, y contará con 48 equipos participantes.\n\nFechas importantes:\n- Sorteo de grupos: Diciembre 2025\n- Inicio del torneo: Junio 11, 2026\n- Final: Julio 19, 2026\n\nSedes destacadas:\n- Estadio Azteca (Ciudad de México)\n- MetLife Stadium (Nueva York)\n- BC Place (Vancouver)\n\nEste formato expandido garantiza más partidos emocionantes y oportunidades para que más naciones compitan al más alto nivel.',
        category: 'deportes',
        imageUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800',
        published: true
    },
    {
        title: '🎭 Festival Internacional de Cine: Celebrando el Séptimo Arte',
        summary: 'El festival presenta una selección excepcional de películas de todo el mundo.',
        content: 'El Festival Internacional de Cine abre sus puertas con una extraordinaria selección de más de 200 películas de 60 países diferentes. Este año, el festival celebra su 50 aniversario con eventos especiales y homenajes.\n\nDestacados del programa:\n- Retrospectiva del cine latinoamericano\n- Competencia de cortometrajes innovadores\n- Masterclasses con directores galardonados\n- Proyecciones al aire libre gratuitas\n\nEl jurado internacional incluye nombres legendarios de la industria cinematográfica, quienes evaluarán las películas en competencia por los codiciados premios del festival.',
        category: 'cultura',
        imageUrl: 'https://images.unsplash.com/photo-1574267432644-f610de7f6ea7?w=800',
        published: true
    },
    {
        title: '💰 Mercados Financieros: Análisis de Tendencias Económicas Globales',
        summary: 'Expertos analizan las perspectivas económicas para el próximo trimestre.',
        content: 'Los mercados financieros mundiales muestran señales mixtas mientras los analistas evalúan las tendencias económicas del próximo trimestre. Los principales índices bursátiles han experimentado volatilidad debido a factores geopolíticos.\n\nPuntos clave del análisis:\n- Tasas de interés: Se espera estabilidad\n- Inflación: Tendencia a la baja en economías desarrolladas\n- Criptomonedas: Mayor regulación en camino\n- Materias primas: Precios del petróleo fluctuantes\n\nLos economistas recomiendan diversificación de carteras y cautela ante la incertidumbre global. El sector tecnológico continúa mostrando resiliencia.',
        category: 'economía',
        imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
        published: true
    },
    {
        title: '🌍 Cumbre Climática: Líderes Mundiales Acuerdan Nuevos Objetivos',
        summary: 'Acuerdos históricos para reducir emisiones de carbono y combatir el cambio climático.',
        content: 'La Cumbre Climática Internacional ha concluido con compromisos sin precedentes de más de 150 naciones para abordar la crisis climática global. Los líderes mundiales han acordado objetivos ambiciosos para las próximas décadas.\n\nCompromisos principales:\n- Reducción del 50% de emisiones para 2035\n- Inversión de $2 trillones en energías renovables\n- Protección del 30% de océanos y tierras\n- Eliminación gradual del carbón para 2040\n\nLos países en desarrollo recibirán apoyo financiero y tecnológico para facilitar la transición verde. Organizaciones ambientales celebran el acuerdo como un paso crucial.',
        category: 'internacional',
        imageUrl: 'https://images.unsplash.com/photo-1569163139394-de4798aa62b0?w=800',
        published: true
    },
    {
        title: '🏛️ Elecciones 2026: Análisis del Panorama Político Nacional',
        summary: 'Un vistazo profundo a los candidatos y propuestas para las próximas elecciones.',
        content: 'A medida que nos acercamos a las elecciones de 2026, el panorama político se vuelve cada vez más dinámico. Los principales partidos han presentado sus candidatos y plataformas electorales.\n\nTemas principales del debate:\n- Reforma del sistema de salud\n- Educación pública y acceso universitario\n- Seguridad ciudadana y justicia\n- Desarrollo económico y empleo\n\nLas encuestas muestran una competencia reñida entre los principales contendientes. Los debates televisados programados para los próximos meses serán cruciales para definir tendencias.',
        category: 'política',
        imageUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800',
        published: true
    },
    {
        title: '🎮 Revolución Gaming: Nueva Consola Rompe Records de Ventas',
        summary: 'La última generación de consolas supera todas las expectativas del mercado.',
        content: 'La industria del gaming celebra el lanzamiento más exitoso de la historia con la nueva generación de consolas. En solo 48 horas, se vendieron más de 5 millones de unidades globalmente.\n\nCaracterísticas destacadas:\n- Gráficos en 8K con ray tracing avanzado\n- Tiempo de carga casi instantáneo con SSD\n- Catálogo de 50+ juegos exclusivos\n- Retrocompatibilidad total\n- Realidad virtual integrada\n\nLos desarrolladores están entusiasmados con las nuevas capacidades técnicas que permitirán crear experiencias de juego inmersivas nunca antes vistas.',
        category: 'tecnología',
        imageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800',
        published: true
    },
    {
        title: '🎨 Exposición "Arte Digital": Fusionando Tecnología y Creatividad',
        summary: 'Una muestra innovadora que explora las fronteras entre arte tradicional y digital.',
        content: 'La galería presenta "Arte Digital", una exposición revolucionaria que desafía las nociones convencionales del arte. Más de 40 artistas de todo el mundo muestran obras que combinan técnicas tradicionales con tecnología de vanguardia.\n\nHighlights de la exposición:\n- Instalaciones de realidad aumentada\n- NFTs y arte blockchain\n- Esculturas cinéticas interactivas\n- Pinturas generadas por IA\n- Performances multimedia\n\nLa exposición estará abierta durante tres meses e incluye talleres educativos para todas las edades sobre las nuevas formas de expresión artística.',
        category: 'cultura',
        published: true
    },
    {
        title: '🏆 Olimpiadas 2028: Los Ángeles se Prepara para el Evento',
        summary: 'La ciudad californiana ultima detalles para recibir a atletas de todo el mundo.',
        content: 'Los Ángeles está en plena preparación para los Juegos Olímpicos de 2028. Las obras de infraestructura avanzan según lo programado, con inversiones millonarias en nuevas instalaciones deportivas.\n\nNuevas sedes olímpicas:\n- Estadio SoFi (Ceremonias)\n- LA Memorial Coliseum (Atletismo)\n- Crypto.com Arena (Baloncesto)\n- Long Beach (Vela y deportes acuáticos)\n\nLa ciudad promete juegos sostenibles, utilizando principalmente instalaciones existentes y transporte público renovado. Se esperan más de 10,000 atletas de 200 países.',
        category: 'deportes',
        published: true
    },
    {
        title: '📱 Inteligencia Artificial: Nuevos Avances en Asistentes Personales',
        summary: 'La IA conversacional alcanza niveles de sofisticación sin precedentes.',
        content: 'Los asistentes virtuales impulsados por IA han alcanzado un nuevo nivel de sofisticación, ofreciendo conversaciones más naturales y comprensión contextual avanzada.\n\nCapacidades mejoradas:\n- Comprensión de lenguaje natural mejorada\n- Memoria contextual a largo plazo\n- Integración multimodal (voz, texto, imagen)\n- Personalización adaptativa\n- Privacidad reforzada con procesamiento local\n\nExpertos predicen que estos avances transformarán la manera en que interactuamos con la tecnología en nuestra vida diaria, haciendo las interfaces más intuitivas y accesibles.',
        category: 'tecnología',
        published: true
    },
    {
        title: '[BORRADOR] Próxima Noticia en Desarrollo',
        summary: 'Esta noticia está siendo preparada por el equipo editorial.',
        content: 'Contenido en desarrollo. Esta noticia será publicada próximamente con información verificada y actualizada.',
        category: 'otros',
        published: false
    }
];

async function seedDatabase() {
    try {
        console.log('🌱 Iniciando seed de datos...');

        // Conectar a bases de datos
        await connectToMongo();
        console.log('✅ Conectado a MongoDB');

        await connectToRedis();
        console.log('✅ Conectado a Redis');

        // Limpiar datos existentes
        console.log('🗑️  Limpiando datos existentes...');
        await User.deleteMany({});
        await News.deleteMany({});
        console.log('✅ Datos limpiados');

        // Crear usuarios
        console.log('👥 Creando usuarios de prueba...');
        const createdUsers = [];
        for (const userData of mockUsers) {
            const user = new User(userData);
            await user.save();
            createdUsers.push(user);
            console.log(`  ✓ Usuario creado: ${user.email} (${user.role})`);
        }

        // Crear noticias
        console.log('📰 Creando noticias de prueba...');
        const admin = createdUsers.find(u => u.role === 'admin');
        const editor1 = createdUsers.find(u => u.email === 'editor1@periodico.com');
        const editor2 = createdUsers.find(u => u.email === 'editor2@periodico.com');

        for (let i = 0; i < mockNews.length; i++) {
            const newsData = mockNews[i];
            
            // Asignar autores de manera distribuida
            let author;
            if (i < 4) {
                author = admin;
            } else if (i < 7) {
                author = editor1;
            } else {
                author = editor2;
            }

            const news = new News({
                ...newsData,
                author: author._id,
                authorName: author.email,
                views: Math.floor(Math.random() * 1000) + 100,
                likesCount: Math.floor(Math.random() * 50)
            });

            // Agregar likes aleatorios
            const numLikes = Math.floor(Math.random() * 3) + 1;
            const randomUsers = createdUsers
                .filter(u => u.role === 'user')
                .sort(() => 0.5 - Math.random())
                .slice(0, numLikes);
            
            news.likes = randomUsers.map(u => u._id);
            news.likesCount = randomUsers.length;

            await news.save();
            console.log(`  ✓ Noticia creada: "${news.title.substring(0, 50)}..." (${news.category})`);
        }

        console.log('\n✅ Seed completado exitosamente!');
        console.log('\n📊 Resumen:');
        console.log(`  - ${createdUsers.length} usuarios creados`);
        console.log(`  - ${mockNews.length} noticias creadas`);
        console.log('\n🔑 Credenciales de acceso:');
        console.log('  Admin:   admin@periodico.com / admin123');
        console.log('  Editor:  editor1@periodico.com / editor123');
        console.log('  Usuario: usuario1@correo.com / user123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error durante el seed:', error);
        process.exit(1);
    }
}

seedDatabase();
