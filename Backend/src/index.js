import app from "./app.js";
import connectDB from "./db/connectDB.js";
import dotenv from "dotenv"
dotenv.config()
import os from "os"
import cluster from "cluster"


let CPUavailable = os.cpus().length;
const port = process.env.PORT || 8080
const numCPUs = process.env.WEB_CONCURRENCY || CPUavailable;


if (cluster.isPrimary) {
    console.log(`Primary ${process.pid} is running`);
    console.log(`Forking ${numCPUs} workers...`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died. Restarting...`);
        cluster.fork();
    });

} else {
    async function Host() {
        try {
            await connectDB()
            app.listen(port, () => { console.log(`Worker ${process.pid} listening on port ${port}`) })
        } catch (error) {
            console.log(`Error while Hosting the server , Error : ${error}`)
        }
    }

    Host();
}