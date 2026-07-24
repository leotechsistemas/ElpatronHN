package com.patron.erp.service;

import com.patron.erp.dto.CompanySettingsRequest;
import com.patron.erp.model.CompanySettings;
import com.patron.erp.repository.CompanySettingsRepository;
import org.springframework.stereotype.Service;

@Service
public class CompanySettingsService {

    private final CompanySettingsRepository repository;

    public CompanySettingsService(CompanySettingsRepository repository) {
        this.repository = repository;
    }

    public CompanySettings getSettings() {
        return repository.findById("COMPANY")
                .orElseGet(() -> {
                    CompanySettings defaults = new CompanySettings();
                    defaults.setId("COMPANY");
                    defaults.setCompanyName("EL PATRON HN");
                    defaults.setSlogan("Tecnologia de Personalizados");
                    defaults.setCurrency("HNL");
                    defaults.setCurrencySymbol("L.");
                    defaults.setIsv(15);
                    defaults.setPhone("+504 2552-1400");
                    defaults.setAddress("San Pedro Sula, Cortes, Honduras");
                    defaults.setEmail("info@elpatron.hn");
                    defaults.setWhatsapp("50425521400");
                    return repository.save(defaults);
                });
    }

    public CompanySettings updateSettings(CompanySettingsRequest req) {
        CompanySettings settings = getSettings();
        if (req.getCompanyName() != null) settings.setCompanyName(req.getCompanyName());
        if (req.getSlogan() != null) settings.setSlogan(req.getSlogan());
        if (req.getLogo() != null) settings.setLogo(req.getLogo());
        if (req.getCurrency() != null) settings.setCurrency(req.getCurrency());
        if (req.getCurrencySymbol() != null) settings.setCurrencySymbol(req.getCurrencySymbol());
        if (req.getIsv() != null) settings.setIsv(req.getIsv());
        if (req.getPhone() != null) settings.setPhone(req.getPhone());
        if (req.getAddress() != null) settings.setAddress(req.getAddress());
        if (req.getEmail() != null) settings.setEmail(req.getEmail());
        if (req.getFacebook() != null) settings.setFacebook(req.getFacebook());
        if (req.getInstagram() != null) settings.setInstagram(req.getInstagram());
        if (req.getTiktok() != null) settings.setTiktok(req.getTiktok());
        if (req.getWhatsapp() != null) settings.setWhatsapp(req.getWhatsapp());
        if (req.getYoutube() != null) settings.setYoutube(req.getYoutube());
        if (req.getLinkedin() != null) settings.setLinkedin(req.getLinkedin());
        return repository.save(settings);
    }
}
