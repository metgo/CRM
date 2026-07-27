import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore TypeORM drivers we don't use
      config.externals = config.externals || [];
      config.externals.push({
        "expo-sqlite": "commonjs expo-sqlite",
        "react-native-sqlite-storage": "commonjs react-native-sqlite-storage",
        "sql.js": "commonjs sql.js",
        sqlite3: "commonjs sqlite3",
        "better-sqlite3": "commonjs better-sqlite3",
        mysql: "commonjs mysql",
        mysql2: "commonjs mysql2",
        oracledb: "commonjs oracledb",
        "pg-native": "commonjs pg-native",
        "@sap/hana-client": "commonjs @sap/hana-client",
        hdb: "commonjs hdb",
        mongodb: "commonjs mongodb",
        mssql: "commonjs mssql",
        tedious: "commonjs tedious",
        typeorm: "commonjs typeorm",
      });

      // TypeORM resolves string-based relations (e.g. @OneToMany("Profile", ...))
      // by class name. Minifying the server bundle mangles those class names
      // (Organization -> "s"), which breaks metadata building at runtime:
      //   TypeORMError: Entity metadata for s#profiles was not found.
      // Keep the server bundle unminified so the entity class names survive.
      config.optimization = config.optimization || {};
      config.optimization.minimize = false;
    }
    return config;
  },
  serverExternalPackages: ["typeorm", "pg", "reflect-metadata"],
};

export default nextConfig;
