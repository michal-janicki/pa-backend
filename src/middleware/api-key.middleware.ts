import { Injectable, NestMiddleware } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
    constructor() {
        dotenv.config();
    }

    use(req: Request, res: Response, next: NextFunction) {
        const apiKey = process.env.API_KEY
        const apiKeyHeader = process.env.API_KEY_HEADER

        if (!apiKey || !apiKeyHeader) return res.status(500).send('Error loading environment variables')

        const apiKeyFromHeader = req.headers[apiKeyHeader];
        if (apiKeyFromHeader !== apiKey) {
            return res.status(401).send('Invalid API key');
        }

        next();
    }
}