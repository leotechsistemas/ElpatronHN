package com.patron.erp.config;

import com.patron.erp.model.*;
import com.patron.erp.repository.*;
import com.patron.erp.service.AccountingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDate;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final AccountCatalogRepository catalogRepository;
    private final CompanySettingsRepository settingsRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccountingService accountingService;

    public DataInitializer(UserRepository userRepository,
                           AccountCatalogRepository catalogRepository,
                           CompanySettingsRepository settingsRepository,
                           PasswordEncoder passwordEncoder,
                           AccountingService accountingService) {
        this.userRepository = userRepository;
        this.catalogRepository = catalogRepository;
        this.settingsRepository = settingsRepository;
        this.passwordEncoder = passwordEncoder;
        this.accountingService = accountingService;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            LocalDate today = LocalDate.now();

            User admin = new User("Xd3u5", "admin@patron.hn",
                    passwordEncoder.encode("Admin123!"), Role.Admin);
            admin.setId("USR-0001");
            admin.setLastPasswordChange(today);
            userRepository.save(admin);

            User vendedor = new User("Carlos Sosa", "carlos@patron.hn",
                    passwordEncoder.encode("Vendedor123!"), Role.Vendedor);
            vendedor.setId("USR-0002");
            vendedor.setLastPasswordChange(today);
            userRepository.save(vendedor);

            User prod = new User("Pedro Ramírez", "pedro@patron.hn",
                    passwordEncoder.encode("Produccion123!"), Role.Produccion);
            prod.setId("USR-0003");
            prod.setLastPasswordChange(today);
            userRepository.save(prod);

            User analista = new User("Lucía Mendoza", "lucia@patron.hn",
                    passwordEncoder.encode("Analista123!"), Role.Analista);
            analista.setId("USR-0004");
            analista.setLastPasswordChange(today);
            userRepository.save(analista);

            log.warn("╔══════════════════════════════════════════════════════╗");
            log.warn("║ USUARIOS SEMILLA CREADOS — CAMBIA SUS CONTRASEÑAS  ║");
            log.warn("║ admin:    admin@patron.hn / Admin123!              ║");
            log.warn("║ vendedor: carlos@patron.hn / Vendedor123!          ║");
            log.warn("║ produccion: pedro@patron.hn / Produccion123!       ║");
            log.warn("║ analista: lucia@patron.hn / Analista123!           ║");
            log.warn("╚══════════════════════════════════════════════════════╝");
        }

        if (catalogRepository.count() == 0) {
            String[][] accounts = {
                {"1", "1", "Activos", "Activo", "1", "", "0", "1"},
                {"1.1", "1.1", "Activo Circulante", "Activo", "2", "1", "0", "1"},
                {"1.1.1", "1.1.1", "Caja", "Activo", "3", "1.1", "1", "1"},
                {"1.1.2", "1.1.2", "Bancos", "Activo", "3", "1.1", "1", "1"},
                {"1.1.3", "1.1.3", "Cuentas por Cobrar", "Activo", "3", "1.1", "1", "1"},
                {"1.1.4", "1.1.4", "Inventario", "Activo", "3", "1.1", "1", "1"},
                {"2", "2", "Pasivos", "Pasivo", "1", "", "0", "1"},
                {"2.1", "2.1", "Pasivo Circulante", "Pasivo", "2", "2", "0", "1"},
                {"2.1.1", "2.1.1", "Impuestos por Pagar", "Pasivo", "3", "2.1", "1", "1"},
                {"3", "3", "Patrimonio", "Patrimonio", "1", "", "0", "1"},
                {"3.1.1", "3.1.1", "Capital", "Patrimonio", "3", "3", "1", "1"},
                {"3.1.2", "3.1.2", "Utilidades Retenidas", "Patrimonio", "3", "3", "1", "1"},
                {"4", "4", "Ingresos", "Ingreso", "1", "", "0", "1"},
                {"4.1.1", "4.1.1", "Ventas", "Ingreso", "3", "4", "1", "1"},
                {"5", "5", "Gastos", "Gasto", "1", "", "0", "1"},
                {"5.1.1", "5.1.1", "Costo de Ventas", "Gasto", "3", "5", "1", "1"},
                {"5.1.2", "5.1.2", "Gastos Operativos", "Gasto", "3", "5", "1", "1"},
            };
            for (String[] a : accounts) {
                AccountCatalog ac = new AccountCatalog();
                ac.setId(a[0]); ac.setCodigo(a[1]); ac.setNombre(a[2]);
                ac.setTipo(a[3]); ac.setNivel(Integer.parseInt(a[4]));
                ac.setPadreId(a[5].isEmpty() ? null : a[5]);
                ac.setAceptaAsientos("1".equals(a[6]));
                ac.setActivo("1".equals(a[7]));
                catalogRepository.save(ac);
            }
            System.out.println(">>> Catálogo de cuentas seed creado");
        }

        if (settingsRepository.count() == 0) {
            CompanySettings cs = new CompanySettings();
            cs.setId("CS-0001");
            cs.setCompanyName("EL PATRÓN HN");
            cs.setSlogan("Soluciones en letreros y más");
            cs.setCurrency("HNL");
            cs.setCurrencySymbol("L.");
            cs.setIsv(15);
            cs.setPhone("2234-5678");
            cs.setAddress("Tegucigalpa, Honduras");
            cs.setEmail("info@elpatron.hn");
            settingsRepository.save(cs);
            System.out.println(">>> Configuración de empresa seed creada");
        }

        accountingService.initOpeningEntry("SISTEMA");
    }
}
