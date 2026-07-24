package com.patron.erp.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DataSourceConfig {

    @Bean
    @Primary
    public DataSource dataSource(DataSourceProperties props) {
        String dbUrl = System.getenv("DATABASE_URL");
        if (dbUrl != null && !dbUrl.isBlank() && props.getUrl() == null) {
            URI uri = URI.create(dbUrl);
            String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + uri.getPort() + uri.getPath();
            String user = uri.getUserInfo().split(":")[0];
            String password = uri.getUserInfo().split(":")[1];
            return DataSourceBuilder.create()
                    .type(HikariDataSource.class)
                    .url(jdbcUrl)
                    .username(user)
                    .password(password)
                    .driverClassName("org.postgresql.Driver")
                    .build();
        }
        return props.initializeDataSourceBuilder().build();
    }
}
