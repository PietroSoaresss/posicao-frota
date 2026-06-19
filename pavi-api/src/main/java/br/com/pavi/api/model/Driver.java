package br.com.pavi.api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

@Entity
@Table(name = "driver")
@JsonIgnoreProperties({"hibernateLazyInitializer"})
public class Driver {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "name is required")
    private String name;

    @NotBlank(message = "sex is required")
    private String sex;

    @NotBlank(message = "licenseNumber is required")
    private String licenseNumber;

    @NotNull(message = "birthDate is required")
    private LocalDate birthDate;

    @NotNull(message = "licenseExpiration is required")
    private LocalDate licenseExpiration;

    @NotNull(message = "city is required")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "city_id")
    private City city;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSex() { return sex; }
    public void setSex(String sex) { this.sex = sex; }
    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
    public LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }
    public LocalDate getLicenseExpiration() { return licenseExpiration; }
    public void setLicenseExpiration(LocalDate licenseExpiration) { this.licenseExpiration = licenseExpiration; }
    public City getCity() { return city; }
    public void setCity(City city) { this.city = city; }
}
