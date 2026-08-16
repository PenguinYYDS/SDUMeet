export interface AppConfig {
  port: number
  nodeEnv: string
  jwtSecret: string
  jwtExpiresIn: string
  databaseUrl: string
  corsOrigins: string
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  databaseUrl:
    process.env.DATABASE_URL || 'postgres://sdumeet:sdumeet_dev@localhost:5432/sdumeet',
  corsOrigins: process.env.CORS_ORIGINS || '*',
})
