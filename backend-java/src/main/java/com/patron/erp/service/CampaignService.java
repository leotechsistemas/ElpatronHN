package com.patron.erp.service;

import com.patron.erp.dto.request.CampaignRequest;
import com.patron.erp.dto.response.CampaignResponse;
import com.patron.erp.model.Campaign;
import com.patron.erp.model.Client;
import com.patron.erp.repository.CampaignRepository;
import com.patron.erp.repository.ClientRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class CampaignService {

    private final CampaignRepository campaignRepository;
    private final ClientRepository clientRepository;
    private final ObjectMapper objectMapper;

    public CampaignService(CampaignRepository campaignRepository,
                           ClientRepository clientRepository,
                           ObjectMapper objectMapper) {
        this.campaignRepository = campaignRepository;
        this.clientRepository = clientRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public CampaignResponse send(CampaignRequest req, String userId) {
        List<Client> allClients = clientRepository.findAll();
        List<Client> targets = filterBySegment(allClients, req.getSegmento());

        List<String> logLines = new ArrayList<>();
        int sent = 0;

        for (Client client : targets) {
            String parsedMsg = req.getMensaje().replace("{Nombre}", client.getNombre());
            StringBuilder sb = new StringBuilder();

            boolean hasWhatsApp = (req.getCanal().equals("WhatsApp") || req.getCanal().equals("Ambos"));
            boolean hasEmail = (req.getCanal().equals("Email") || req.getCanal().equals("Ambos"));

            if (hasWhatsApp) {
                String phone = client.getTelefono() != null ? client.getTelefono().replaceAll("\\D", "") : "";
                if (phone.isEmpty()) {
                    sb.append("[WA] ").append(client.getNombre()).append(" - Sin teléfono - SKIP");
                } else {
                    sb.append("[WA] ").append(client.getNombre()).append(" (").append(client.getTelefono()).append(") -> wa.me/").append(phone);
                    sent++;
                }
            }

            if (hasEmail && hasWhatsApp) sb.append(" | ");

            if (hasEmail) {
                String email = client.getEmail() != null ? client.getEmail() : "";
                if (email.isEmpty()) {
                    sb.append("[EMAIL] ").append(client.getNombre()).append(" - Sin correo - SKIP");
                } else {
                    sb.append("[EMAIL] ").append(client.getNombre()).append(" (").append(email).append(") Asunto: \"").append(req.getAsunto() != null ? req.getAsunto() : "").append("\"");
                    sent++;
                }
            }

            logLines.add(sb.toString());
        }

        String logsJson;
        try {
            logsJson = objectMapper.writeValueAsString(logLines);
        } catch (JsonProcessingException e) {
            logsJson = "[]";
        }

        Campaign c = new Campaign();
        c.setSegmento(req.getSegmento());
        c.setCanal(req.getCanal());
        c.setPlantilla(req.getPlantilla());
        c.setAsunto(req.getAsunto());
        c.setMensaje(req.getMensaje());
        c.setClientesCount(targets.size());
        c.setEnviadosCount(sent);
        c.setEstado(sent > 0 ? "Enviado" : "Error");
        c.setCreadoPor(userId);
        c.setCreadoEn(LocalDateTime.now());
        c.setLogs(logsJson);
        c = campaignRepository.save(c);

        return toResponse(c, logLines);
    }

    private List<Client> filterBySegment(List<Client> clients, String segmento) {
        if ("Todos".equalsIgnoreCase(segmento)) return clients;
        return clients.stream()
                .filter(c -> c.getClasificacion() != null && c.getClasificacion().equalsIgnoreCase(segmento))
                .toList();
    }

    private CampaignResponse toResponse(Campaign c, List<String> logLines) {
        CampaignResponse r = new CampaignResponse();
        r.setId(c.getId());
        r.setSegmento(c.getSegmento());
        r.setCanal(c.getCanal());
        r.setPlantilla(c.getPlantilla());
        r.setAsunto(c.getAsunto());
        r.setMensaje(c.getMensaje());
        r.setClientesCount(c.getClientesCount());
        r.setEnviadosCount(c.getEnviadosCount());
        r.setEstado(c.getEstado());
        r.setCreadoEn(c.getCreadoEn() != null ? c.getCreadoEn().toString() : null);
        r.setLogs(logLines);
        return r;
    }
}
