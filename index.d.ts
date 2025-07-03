export * from 'prom-client'
declare module "express-metrics-middleware" {
    export function signalIsNotUp(): void;
    export function signalIsUp(): void;
    export function createMiddleware(option:Object);
}