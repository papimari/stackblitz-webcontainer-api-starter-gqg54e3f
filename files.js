/** @satisfies {import('@webcontainer/api').FileSystemTree} */

export const files = {
    'index.js': {
      file: {
        contents: `
import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import { createUser, getAllUsers, getUserById, updateUser, deleteUser } from './controllers/userController.js';
import { uploadFile, getFiles, downloadFile, deleteFile } from './controllers/fileController.js';

const app = express();
const port = 3111;

// Middleware para parsear JSON
app.use(express.json());

// Conexión a MongoDB
const mongoURI = 'mongodb://localhost:27017/miapp';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Conectado a MongoDB');
}).catch(err => {
  console.error('Error de conexión a MongoDB:', err);
});

// Configuración de GridFS para archivos
const storage = new GridFsStorage({
  url: mongoURI,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return {
      bucketName: 'uploads',
      filename: \`\${Date.now()}-\${file.originalname}\`,
      metadata: {
        uploadedBy: req.body.userId || 'anonymous',
        contentType: file.mimetype,
        size: file.size
      }
    };
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB en bytes
    files: 1 // un archivo a la vez
  },
  fileFilter: (req, file, cb) => {
    // Lista de tipos MIME permitidos
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'), false);
    }
  }
});

// Rutas de la API
app.get('/', (req, res) => {
    res.send('Welcome to a WebContainers app! 🥳');
});

// Rutas CRUD Usuarios
app.post('/api/users', createUser);
app.get('/api/users', getAllUsers);
app.get('/api/users/:id', getUserById);
app.put('/api/users/:id', updateUser);
app.delete('/api/users/:id', deleteUser);

// Rutas para archivos
app.post('/api/files/upload', upload.single('file'), uploadFile);
app.get('/api/files', getFiles);
app.get('/api/files/:id', downloadFile);
app.delete('/api/files/:id', deleteFile);

// Middleware de manejo de errores
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'El archivo excede el límite de 15MB'
      });
    }
  }
  res.status(500).json({
    message: error.message || 'Error interno del servidor'
  });
});

app.listen(port, () => {
    console.log(\`App is live at http://localhost:\${port}\`);
});`,
      },
    },
    'package.json': {
      file: {
        contents: `
          {
            "name": "example-app",
            "type": "module",
            "bin": {
              "file-manager": "./cli/fileManager.js"
            },
            "dependencies": {
              "express": "latest",
              "nodemon": "latest",
              "mongoose": "^7.3.0",
              "multer": "^1.4.4",
              "multer-gridfs-storage": "^5.0.2",
              "gridfs-stream": "^1.1.1",
              "commander": "^11.0.0",
              "inquirer": "^9.2.7",
              "chalk": "^5.3.0",
              "ora": "^7.0.1",
              "cli-table3": "^0.6.3"
            },
            "scripts": {
              "start": "nodemon index.js",
              "cli": "node cli/fileManager.js"
            }
          }`,
      },
    },
    'models/userModel.js': {
      file: {
        contents: `
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    edad: {
        type: Number,
        min: 0
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
});

export const User = mongoose.model('User', userSchema);
`
      }
    },
    'controllers/userController.js': {
      file: {
        contents: `
import { User } from '../models/userModel.js';

// Crear nuevo usuario
export const createUser = async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Obtener todos los usuarios
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener usuario por ID
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Actualizar usuario
export const updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Eliminar usuario
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (user) {
            res.json({ message: 'Usuario eliminado correctamente' });
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
`
      }
    },
    'controllers/fileController.js': {
      file: {
        contents: `
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

let gfs;
mongoose.connection.once('open', () => {
    gfs = new GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
    });
});

// Subir archivo
export const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se ha proporcionado ningún archivo' });
        }
        
        res.status(201).json({
            message: 'Archivo subido correctamente',
            file: {
                id: req.file.id,
                filename: req.file.filename,
                size: req.file.size,
                contentType: req.file.contentType,
                uploadDate: req.file.uploadDate
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Obtener lista de archivos
export const getFiles = async (req, res) => {
    try {
        const files = await mongoose.connection.db
            .collection('uploads.files')
            .find({})
            .toArray();
            
        if (!files || files.length === 0) {
            return res.status(404).json({ message: 'No hay archivos disponibles' });
        }
        
        res.json(files);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Descargar archivo
export const downloadFile = async (req, res) => {
    try {
        const file = await mongoose.connection.db
            .collection('uploads.files')
            .findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });

        if (!file) {
            return res.status(404).json({ message: 'Archivo no encontrado' });
        }

        res.set('Content-Type', file.contentType);
        res.set('Content-Disposition', \`attachment; filename="\${file.filename}"\`);

        const downloadStream = gfs.openDownloadStream(file._id);
        downloadStream.pipe(res);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Eliminar archivo
export const deleteFile = async (req, res) => {
    try {
        const file = await mongoose.connection.db
            .collection('uploads.files')
            .findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });

        if (!file) {
            return res.status(404).json({ message: 'Archivo no encontrado' });
        }

        await gfs.delete(file._id);
        res.json({ message: 'Archivo eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
`
      }
    }
  };