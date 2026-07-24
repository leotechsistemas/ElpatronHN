package com.patron.erp.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    private String id;

    @Column(name = "nombre", nullable = false, length = 100)
    private String name;

    @Column(name = "correo", nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "contrasena", nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "rol", nullable = false, length = 20)
    private Role role;

    @Column(name = "activo", nullable = false)
    private Boolean active = true;

    @Column(name = "dni", length = 20)
    private String dni;

    @Column(name = "telefono", length = 30)
    private String phone;

    @Column(name = "direccion", length = 200)
    private String address;

    @Column(name = "puesto", length = 100)
    private String position;

    @Column(name = "departamento", length = 50)
    private String department;

    @Column(name = "salario")
    private Long salary;

    @Column(name = "fecha_contratacion")
    private LocalDate hireDate;

    @Column(name = "fecha_nacimiento")
    private LocalDate birthDate;

    @Column(name = "contacto_emergencia", length = 100)
    private String emergencyContact;

    @Column(name = "telefono_emergencia", length = 30)
    private String emergencyPhone;

    @Column(name = "intentos_fallidos")
    private Integer failedAttempts = 0;

    @Column(name = "bloqueado_hasta")
    private LocalDateTime lockedUntil;

    @Column(name = "ultimo_cambio_contrasena")
    private LocalDate lastPasswordChange;

    @Column(name = "contrasena_expirada")
    private Boolean passwordExpired = false;

    public User() {}

    public User(String name, String email, String password, Role role) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.active = true;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public String getDni() { return dni; }
    public void setDni(String dni) { this.dni = dni; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public Long getSalary() { return salary; }
    public void setSalary(Long salary) { this.salary = salary; }
    public LocalDate getHireDate() { return hireDate; }
    public void setHireDate(LocalDate hireDate) { this.hireDate = hireDate; }
    public LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }
    public String getEmergencyContact() { return emergencyContact; }
    public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }
    public String getEmergencyPhone() { return emergencyPhone; }
    public void setEmergencyPhone(String emergencyPhone) { this.emergencyPhone = emergencyPhone; }
    public Integer getFailedAttempts() { return failedAttempts; }
    public void setFailedAttempts(Integer failedAttempts) { this.failedAttempts = failedAttempts; }
    public LocalDateTime getLockedUntil() { return lockedUntil; }
    public void setLockedUntil(LocalDateTime lockedUntil) { this.lockedUntil = lockedUntil; }
    public LocalDate getLastPasswordChange() { return lastPasswordChange; }
    public void setLastPasswordChange(LocalDate lastPasswordChange) { this.lastPasswordChange = lastPasswordChange; }
    public Boolean getPasswordExpired() { return passwordExpired; }
    public void setPasswordExpired(Boolean passwordExpired) { this.passwordExpired = passwordExpired; }
}
