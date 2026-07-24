package com.patron.erp.service;

import com.patron.erp.dto.request.UserRequest;
import com.patron.erp.dto.response.UserResponse;
import com.patron.erp.model.Role;
import com.patron.erp.model.User;
import com.patron.erp.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    public List<UserResponse> findAllActive() {
        return repository.findByActiveTrueOrderByName().stream().map(this::toResponse).toList();
    }

    public UserResponse findById(String id) {
        return repository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    public UserResponse create(UserRequest req) {
        if (repository.existsByEmail(req.getCorreo())) {
            throw new RuntimeException("El correo ya está registrado");
        }
        User u = new User();
        u.setId(generateId());
        applyRequest(u, req);
        if (req.getContrasena() != null && !req.getContrasena().isEmpty()) {
            u.setPassword(passwordEncoder.encode(req.getContrasena()));
        } else {
            u.setPassword(passwordEncoder.encode("Temp123!"));
        }
        u.setActive(true);
        return toResponse(repository.save(u));
    }

    public UserResponse update(String id, UserRequest req) {
        User u = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        applyRequest(u, req);
        if (req.getContrasena() != null && !req.getContrasena().isEmpty()) {
            u.setPassword(passwordEncoder.encode(req.getContrasena()));
        }
        return toResponse(repository.save(u));
    }

    public UserResponse toggle(String id, Boolean activo) {
        User u = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        u.setActive(activo != null ? activo : !u.getActive());
        return toResponse(repository.save(u));
    }

    public void delete(String id) {
        if (!repository.existsById(id)) throw new RuntimeException("Usuario no encontrado");
        repository.deleteById(id);
    }

    public Map<String, Long> getDepartmentStats() {
        List<Object[]> rows = repository.countByDepartment();
        return rows.stream().collect(java.util.stream.Collectors.toMap(
            r -> (String) r[0], r -> (Long) r[1]));
    }

    public Map<String, Long> getPositionStats() {
        List<Object[]> rows = repository.countByPosition();
        return rows.stream().collect(java.util.stream.Collectors.toMap(
            r -> (String) r[0], r -> (Long) r[1]));
    }

    public long getActiveCount() {
        return repository.findByActiveTrueOrderByName().size();
    }

    private void applyRequest(User u, UserRequest req) {
        u.setName(req.getNombre());
        u.setEmail(req.getCorreo());
        u.setRole(Role.valueOf(req.getRol()));
        u.setDni(req.getDni());
        u.setPhone(req.getTelefono());
        u.setAddress(req.getDireccion());
        u.setPosition(req.getPuesto());
        u.setDepartment(req.getDepartamento());
        u.setSalary(req.getSalario());
        u.setHireDate(req.getFechaContratacion() != null ? LocalDate.parse(req.getFechaContratacion()) : null);
        u.setBirthDate(req.getFechaNacimiento() != null ? LocalDate.parse(req.getFechaNacimiento()) : null);
        u.setEmergencyContact(req.getContactoEmergencia());
        u.setEmergencyPhone(req.getTelefonoEmergencia());
    }

    private String generateId() { return "USR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(); }

    private UserResponse toResponse(User u) {
        UserResponse r = new UserResponse();
        r.setId(u.getId());
        r.setNombre(u.getName());
        r.setCorreo(u.getEmail());
        r.setRol(u.getRole().name());
        r.setActivo(u.getActive());
        r.setDni(u.getDni());
        r.setTelefono(u.getPhone());
        r.setDireccion(u.getAddress());
        r.setPuesto(u.getPosition());
        r.setDepartamento(u.getDepartment());
        r.setSalario(u.getSalary());
        r.setFechaContratacion(u.getHireDate() != null ? u.getHireDate().toString() : null);
        r.setFechaNacimiento(u.getBirthDate() != null ? u.getBirthDate().toString() : null);
        r.setContactoEmergencia(u.getEmergencyContact());
        r.setTelefonoEmergencia(u.getEmergencyPhone());
        return r;
    }
}
