const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Options de configuration basique pour la documentation de notre API
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SwellSync API',
            version: '1.0.0',
            description: 'API de gestion globale des spots, utilisateurs, et rapports météos pour SwellSync.',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Serveur Local'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    // Chemins vers les fichiers où sont commentées nos routes API
    apis: ['./server.js'],
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
    // Rend la documentation accessible localement sur /api-docs
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log("📄 Documentation Swagger active sur: http://localhost:3000/api-docs");
};

module.exports = setupSwagger;
