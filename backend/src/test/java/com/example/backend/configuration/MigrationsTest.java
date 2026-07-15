package com.example.backend.configuration;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.io.IOException;
import java.io.StringReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

/**
 * The production database is built by the Flyway migrations, not by Hibernate, so an entity change without a matching
 * migration would only fail at deployment ("Schema-validation: missing column"). This compares, table by table, the
 * columns Hibernate builds from the entities (on H2) with the columns the migrations create.
 * <p>
 * The parser understands {@code CREATE TABLE} and {@code ALTER TABLE ... ADD [COLUMN]}; write new migrations in those
 * forms (or extend the parser). The migrations themselves are verified against a real MySQL, see docs/AUDIT.md.
 */
@DataJpaTest
class MigrationsTest {

    private static final Path MIGRATIONS = Path.of("src/main/resources/db/migration");
    private static final Path RESOURCES = Path.of("src/main/resources");
    private static final Pattern CREATE_TABLE = Pattern.compile("CREATE TABLE `(\\w+)` \\((.*?)\\n\\)", Pattern.DOTALL);
    private static final Pattern COLUMN_LINE = Pattern.compile("^\\s+`(\\w+)`\\s", Pattern.MULTILINE);
    private static final Pattern ADD_COLUMN = Pattern
            .compile("ALTER TABLE `(\\w+)`\\s+ADD (?:COLUMN )?`(\\w+)`", Pattern.CASE_INSENSITIVE);

    @Autowired
    private EntityManager entityManager;

    @Test
    void theMigrationsCreateEveryTableAndColumnTheEntitiesNeed() throws IOException {
        Map<String, Set<String>> fromEntities = columnsHibernateBuilds();
        Map<String, Set<String>> fromMigrations = columnsMigrationsBuild();

        assertFalse(fromEntities.isEmpty());
        assertEquals(fromEntities.keySet(), fromMigrations.keySet(),
                "tables differ between the entities and db/migration: add a migration for the new/removed table");
        for (String table : fromEntities.keySet()) {
            assertEquals(fromEntities.get(table), fromMigrations.get(table),
                    "columns of '" + table + "' differ between the entity and db/migration: add a migration");
        }
    }

    @Test
    void migrationFilesAreNumberedWithoutGapsOrDuplicates() throws IOException {
        try (Stream<Path> files = Files.list(MIGRATIONS)) {
            List<Integer> versions = files.map(p -> p.getFileName().toString())
                    .map(name -> {
                        Matcher m = Pattern.compile("^V(\\d+)__[a-z0-9_]+\\.sql$").matcher(name);
                        assertTrue(m.matches(), "bad migration file name: " + name + " (expected V<n>__snake_case.sql)");
                        return Integer.parseInt(m.group(1));
                    }).sorted().toList();
            assertFalse(versions.isEmpty());
            for (int i = 0; i < versions.size(); i++) {
                assertEquals(i + 1, versions.get(i), "migration versions must be 1, 2, 3, ... without gaps or repeats");
            }
        }
    }

    @Test
    void flywayIsOnlyEnabledInProductionAndBaselinesExistingDatabases() throws IOException {
        assertEquals("false", load("application.properties").getProperty("spring.flyway.enabled"));
        assertEquals("false", load("application-dev.properties").getProperty("spring.flyway.enabled", "false"));
        Properties prod = load("application-prod.properties");
        assertEquals("true", prod.getProperty("spring.flyway.enabled"));
        // Without these, a database created by ddl-auto=update (every existing deployment) would refuse to start
        assertEquals("true", prod.getProperty("spring.flyway.baseline-on-migrate"));
        assertEquals("1", prod.getProperty("spring.flyway.baseline-version"));
        assertEquals("validate", prod.getProperty("spring.jpa.hibernate.ddl-auto"));
    }

    private Properties load(String name) throws IOException {
        Properties properties = new Properties();
        properties.load(new StringReader(Files.readString(RESOURCES.resolve(name))));
        return properties;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Set<String>> columnsHibernateBuilds() {
        List<Object[]> rows = entityManager.createNativeQuery(
                "select table_name, column_name from information_schema.columns where table_schema = 'PUBLIC'")
                .getResultList();
        Map<String, Set<String>> tables = new TreeMap<>();
        for (Object[] row : rows) {
            tables.computeIfAbsent(((String) row[0]).toLowerCase(), k -> new TreeSet<>())
                    .add(((String) row[1]).toLowerCase());
        }
        return tables;
    }

    private Map<String, Set<String>> columnsMigrationsBuild() throws IOException {
        List<Path> files;
        try (Stream<Path> stream = Files.list(MIGRATIONS)) {
            files = stream.sorted().toList();
        }
        Map<String, Set<String>> tables = new TreeMap<>();
        for (Path file : files) {
            String sql = Files.readString(file);
            Matcher create = CREATE_TABLE.matcher(sql);
            while (create.find()) {
                Set<String> columns = tables.computeIfAbsent(create.group(1).toLowerCase(), k -> new TreeSet<>());
                Matcher column = COLUMN_LINE.matcher(create.group(2));
                while (column.find()) {
                    columns.add(column.group(1).toLowerCase());
                }
            }
            Matcher add = ADD_COLUMN.matcher(sql);
            while (add.find()) {
                tables.computeIfAbsent(add.group(1).toLowerCase(), k -> new TreeSet<>()).add(add.group(2).toLowerCase());
            }
        }
        return tables;
    }
}
