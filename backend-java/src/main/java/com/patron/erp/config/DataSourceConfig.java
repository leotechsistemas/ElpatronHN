package com.patron.erp.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DataSourceConfig {

    @Bean
    public DataSource dataSource() {
        String dbUrl = env("DATABASE_URL");
        if (dbUrl != null) {
            URI uri = URI.create(dbUrl);
            String host = uri.getHost();
            int port = uri.getPort() > 0 ? uri.getPort() : 5432;
            String path = uri.getPath(); // "/database_name"
            String[] userInfo = uri.getUserInfo().split(":");
            return DataSourceBuilder.create()
                    .type(HikariDataSource.class)
                    .url("jdbc:postgresql://" + host + ":" + port + path)
                    .username(userInfo[0])
                    .password(userInfo[1])
                    .driverClassName("org.postgresql.Driver")
                    .build();
        }

        String jdbcUrl = env("SPRING_DATASOURCE_URL");
        String user = env("SPRING_DATASOURCE_USERNAME");
        String pass = env("SPRING_DATASOURCE_PASSWORD");
        if (jdbcUrl == null) {
            throw new IllegalStateException("Debes configurar DATABASE_URL o SPRING_DATASOURCE_URL como variable de entorno.");
        }
        return DataSourceBuilder.create()
                .type(HikariDataSource.class)
                .url(jdbcUrl)
                .username(user)
                .password(pass)
                .driverClassName("org.postgresql.Driver")
                .build();
    }

    private static String env(String key) {
        String val = System.getenv(key);
        return (val != null && !val.isBlank()) ? val : null;
    }
}
