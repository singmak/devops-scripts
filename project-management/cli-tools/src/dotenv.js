import { config } from 'dotenv';

const extraEnv = process.env.ENV ? `${process.env.ENV}.env` : 'dev2.env';

function configEnv() {
    config({
        path: `${process.env.HOME}/fleet/.env`
    });
    config({
        path: `${process.env.HOME}/fleet/${extraEnv}`
    });
}

export default configEnv;
