#!/usr/bin/env node

import { program } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import fs from 'fs';
import path from 'path';
import Table from 'cli-table3';

const mongoURI = 'mongodb://localhost:27017/miapp';
let gfs;

// Conectar a MongoDB
async function connectDB() {
    const spinner = ora('Conectando a MongoDB...').start();
    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        gfs = new GridFSBucket(mongoose.connection.db, {
            bucketName: 'uploads'
        });
        spinner.succeed('Conectado a MongoDB');
    } catch (error) {
        spinner.fail('Error al conectar a MongoDB');
        console.error(chalk.red(error.message));
        process.exit(1);
    }
}

// Listar archivos
async function listFiles() {
    const spinner = ora('Obteniendo lista de archivos...').start();
    try {
        const files = await mongoose.connection.db
            .collection('uploads.files')
            .find({})
            .toArray();

        if (!files || files.length === 0) {
            spinner.info('No hay archivos almacenados');
            return;
        }

        spinner.succeed('Archivos encontrados:');

        const table = new Table({
            head: ['ID', 'Nombre', 'Tamaño (MB)', 'Tipo', 'Fecha'],
            colWidths: [24, 30, 15, 20, 25]
        });

        files.forEach(file => {
            table.push([
                file._id.toString(),
                file.filename,
                (file.length / (1024 * 1024)).toFixed(2),
                file.contentType || 'N/A',
                new Date(file.uploadDate).toLocaleString()
            ]);
        });

        console.log(table.toString());
    } catch (error) {
        spinner.fail('Error al listar archivos');
        console.error(chalk.red(error.message));
    }
}

// Subir archivo
async function uploadFile(filePath) {
    const spinner = ora('Subiendo archivo...').start();
    try {
        const filename = path.basename(filePath);
        const fileStream = fs.createReadStream(filePath);
        const uploadStream = gfs.openUploadStream(filename, {
            metadata: {
                uploadedBy: 'CLI',
                uploadDate: new Date()
            }
        });

        await new Promise((resolve, reject) => {
            fileStream.pipe(uploadStream)
                .on('error', reject)
                .on('finish', resolve);
        });

        spinner.succeed(chalk.green(`Archivo "${filename}" subido correctamente`));
    } catch (error) {
        spinner.fail('Error al subir el archivo');
        console.error(chalk.red(error.message));
    }
}

// Eliminar archivo
async function deleteFile(fileId) {
    const spinner = ora('Eliminando archivo...').start();
    try {
        await gfs.delete(new mongoose.Types.ObjectId(fileId));
        spinner.succeed(chalk.green('Archivo eliminado correctamente'));
    } catch (error) {
        spinner.fail('Error al eliminar el archivo');
        console.error(chalk.red(error.message));
    }
}

// Descargar archivo
async function downloadFile(fileId, outputPath) {
    const spinner = ora('Descargando archivo...').start();
    try {
        const file = await mongoose.connection.db
            .collection('uploads.files')
            .findOne({ _id: new mongoose.Types.ObjectId(fileId) });

        if (!file) {
            spinner.fail('Archivo no encontrado');
            return;
        }

        const downloadStream = gfs.openDownloadStream(file._id);
        const writeStream = fs.createWriteStream(outputPath || file.filename);

        await new Promise((resolve, reject) => {
            downloadStream.pipe(writeStream)
                .on('error', reject)
                .on('finish', resolve);
        });

        spinner.succeed(chalk.green(`Archivo descargado como "${outputPath || file.filename}"`));
    } catch (error) {
        spinner.fail('Error al descargar el archivo');
        console.error(chalk.red(error.message));
    }
}

// Configuración del CLI
program
    .version('1.0.0')
    .description('Gestor de archivos MongoDB GridFS');

program
    .command('list')
    .description('Listar todos los archivos almacenados')
    .action(async () => {
        await connectDB();
        await listFiles();
        mongoose.connection.close();
    });

program
    .command('upload <filePath>')
    .description('Subir un archivo')
    .action(async (filePath) => {
        await connectDB();
        await uploadFile(filePath);
        mongoose.connection.close();
    });

program
    .command('download <fileId> [outputPath]')
    .description('Descargar un archivo')
    .action(async (fileId, outputPath) => {
        await connectDB();
        await downloadFile(fileId, outputPath);
        mongoose.connection.close();
    });

program
    .command('delete <fileId>')
    .description('Eliminar un archivo')
    .action(async (fileId) => {
        await connectDB();
        const { confirm } = await inquirer.prompt([{
            type: 'confirm',
            name: 'confirm',
            message: '¿Estás seguro de que quieres eliminar este archivo?',
            default: false
        }]);

        if (confirm) {
            await deleteFile(fileId);
        } else {
            console.log(chalk.yellow('Operación cancelada'));
        }
        mongoose.connection.close();
    });

program.parse(process.argv);
