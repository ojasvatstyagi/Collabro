package com.example.backend.configuration;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.StringReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Properties;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Guards the committed configuration: secrets must come from the environment, and the production profile must
 * keep its safety settings. Reads the real files (the test classpath shadows application.properties).
 */
class ConfigFilesTest {

    private static final Path RESOURCES = Path.of("src/main/resources");
    private static final Pattern SECRET_KEY = Pattern.compile("(?i).*(password|secret|username|token|api-key).*");

    private Properties load(String name) throws IOException {
        Properties properties = new Properties();
        properties.load(new StringReader(Files.readString(RESOURCES.resolve(name))));
        return properties;
    }

    @Test
    void noCommittedPropertiesFileContainsALiteralSecret() throws IOException {
        for (String file : new String[] { "application.properties", "application-dev.properties",
                "application-prod.properties" }) {
            Properties properties = load(file);
            for (String key : properties.stringPropertyNames()) {
                String value = properties.getProperty(key);
                if (SECRET_KEY.matcher(key).matches() && !key.contains("expiration") && !key.contains("cookie")) {
                    assertTrue(value.isBlank() || value.startsWith("${"),
                            file + ": '" + key + "' must reference an environment variable, not hold a value");
                }
            }
        }
    }

    @Test
    void theJwtSecretHasNoFallbackSoAMissingOneStopsStartup() throws IOException {
        assertEquals("${JWT_SECRET}", load("application.properties").getProperty("jwt.secret"));
    }

    @Test
    void theEnvFileIsIgnoredByGitAndATemplateIsProvided() throws IOException {
        assertTrue(Files.readString(Path.of(".gitignore")).lines().anyMatch(line -> line.trim().equals(".env")));
        String template = Files.readString(Path.of(".env.example"));
        assertTrue(template.contains("JWT_SECRET="));
        // the template must be empty of values for secrets
        template.lines().filter(line -> line.matches("(DB_PASSWORD|MAIL_PASSWORD|JWT_SECRET|DB_USERNAME|MAIL_USERNAME)=.+"))
                .findAny().ifPresent(line -> fail("the template holds a value: " + line.split("=")[0]));
    }

    @Test
    void theProductionProfileDoesNotChangeTheSchemaLogSqlOrExposeApiDocs() throws IOException {
        Properties prod = load("application-prod.properties");

        assertEquals("validate", prod.getProperty("spring.jpa.hibernate.ddl-auto"));
        assertEquals("false", prod.getProperty("spring.jpa.show-sql"));
        assertEquals("false", prod.getProperty("springdoc.api-docs.enabled"));
        assertEquals("false", prod.getProperty("springdoc.swagger-ui.enabled"));
        assertEquals("true", prod.getProperty("jwt.cookie.secure"));
    }

    @Test
    void theProductionProfileHasNoDefaultsForAnythingEnvironmentSpecific() throws IOException {
        Properties prod = load("application-prod.properties");
        for (String key : new String[] { "spring.datasource.url", "spring.datasource.password", "spring.mail.host",
                "app.cors.allowed-origins", "app.upload.base-path" }) {
            String value = prod.getProperty(key);
            assertNotNull(value, key);
            assertFalse(value.contains(":"), key + " must not have a fallback value: " + value);
        }
    }

    @Test
    void sharedPropertiesDoNotTurnOnSqlLoggingOrDevtools() throws IOException {
        Properties shared = load("application.properties");

        assertEquals("false", shared.getProperty("spring.jpa.show-sql"));
        assertNull(shared.getProperty("spring.devtools.restart.enabled"));
    }
}
