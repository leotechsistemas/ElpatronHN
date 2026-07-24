package com.patron.erp.controller;

import com.patron.erp.model.Lead;
import com.patron.erp.repository.LeadRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    private final LeadRepository leadRepository;

    public PublicController(LeadRepository leadRepository) {
        this.leadRepository = leadRepository;
    }

    @PostMapping("/request-quote")
    public ResponseEntity<Map<String, Object>> requestQuote(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {

        Lead lead = new Lead();
        lead.setNombre(getStr(body, "nombre"));
        lead.setCorreo(getStr(body, "correo"));
        lead.setTelefono(getStr(body, "telefono"));
        lead.setEmpresa(getStr(body, "empresa"));
        lead.setCategoria(getStr(body, "categoria"));
        lead.setDescripcion(getStr(body, "descripcion"));
        lead.setDetalles(getStr(body, "detalles"));

        String ip = request.getRemoteAddr();
        if (ip == null || ip.equals("0:0:0:0:0:0:0:1")) ip = "127.0.0.1";
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) ip = forwarded.split(",")[0].trim();
        lead.setIpAddress(ip);

        lead.setUserAgent(truncate(request.getHeader("User-Agent"), 500));
        lead.setReferer(truncate(request.getHeader("Referer"), 500));
        lead.setPageUrl(truncate(request.getHeader("Sec-Fetch-Site") != null
                ? request.getRequestURL().toString() : request.getHeader("Origin"), 500));

        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            String cookieStr = Arrays.stream(cookies)
                    .map(c -> c.getName() + "=" + c.getValue())
                    .collect(Collectors.joining("; "));
            lead.setCookies(truncate(cookieStr, 2000));
        }

        lead = leadRepository.save(lead);

        System.out.println("[LEAD #" + lead.getId() + "] " + lead.getNombre()
                + " | IP: " + lead.getIpAddress()
                + " | UA: " + (lead.getUserAgent() != null ? lead.getUserAgent().substring(0, Math.min(50, lead.getUserAgent().length())) : "N/A"));

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Cotización recibida",
                "id", lead.getId()
        ));
    }

    private String getStr(Map<String, Object> map, String key) {
        Object v = map.get(key);
        return v != null ? v.toString() : null;
    }

    private String truncate(String s, int max) {
        return s != null && s.length() > max ? s.substring(0, max) : s;
    }
}
