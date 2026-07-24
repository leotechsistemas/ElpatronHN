package com.patron.erp.config;

import com.patron.erp.model.User;
import com.patron.erp.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Map;

@Aspect
@Component
public class AuditAspect {

    private final AuditService auditService;

    public AuditAspect(AuditService auditService) {
        this.auditService = auditService;
    }

    @AfterReturning("@annotation(org.springframework.web.bind.annotation.PostMapping) && " +
            "within(com.patron.erp.controller..*)")
    public void auditCreate(JoinPoint jp) {
        logAudit(jp, "CREAR");
    }

    @AfterReturning("@annotation(org.springframework.web.bind.annotation.PutMapping) && " +
            "within(com.patron.erp.controller..*)")
    public void auditUpdate(JoinPoint jp) {
        logAudit(jp, "EDITAR");
    }

    @AfterReturning("@annotation(org.springframework.web.bind.annotation.DeleteMapping) && " +
            "within(com.patron.erp.controller..*)")
    public void auditDelete(JoinPoint jp) {
        logAudit(jp, "ELIMINAR");
    }

    @AfterReturning("@annotation(org.springframework.web.bind.annotation.PatchMapping) && " +
            "within(com.patron.erp.controller..*)")
    public void auditPatch(JoinPoint jp) {
        logAudit(jp, "PATCH");
    }

    private void logAudit(JoinPoint jp, String accion) {
        try {
            String usuario = "anónimo";
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof User u) {
                usuario = u.getEmail();
            }

            String entidad = jp.getTarget().getClass().getSimpleName().replace("Controller", "");
            String idExtraido = extraerId(jp.getArgs());

            String ip = "";
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest req = attrs.getRequest();
                String xff = req.getHeader("X-Forwarded-For");
                ip = (xff != null && !xff.isBlank()) ? xff.split(",")[0].trim() : req.getRemoteAddr();
            }

            auditService.log(usuario, accion, entidad, idExtraido, jp.getSignature().getName(), ip);
        } catch (Exception e) {
            // silent — never break the main flow
        }
    }

    private String extraerId(Object[] args) {
        if (args == null) return "";
        for (Object arg : args) {
            if (arg instanceof String s && s.matches("[A-Z]+-?\\d+")) return s;
            if (arg instanceof Map m && m.containsKey("id")) return String.valueOf(m.get("id"));
        }
        return "";
    }
}
