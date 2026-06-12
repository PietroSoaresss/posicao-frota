package br.com.pavi.api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "company")
@JsonIgnoreProperties({"hibernateLazyInitializer"})
public class Company {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "corporateName is required")
    private String corporateName;

    @NotBlank(message = "cnpj is required")
    private String cnpj;

    @NotBlank(message = "zipCode is required")
    private String zipCode;

    @NotBlank(message = "neighborhood is required")
    private String neighborhood;

    @NotBlank(message = "street is required")
    private String street;

    private String complement;

    @NotBlank(message = "number is required")
    private String number;

    @NotNull(message = "city is required")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "city_id")
    private City city;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCorporateName() { return corporateName; }
    public void setCorporateName(String corporateName) { this.corporateName = corporateName; }
    public String getCnpj() { return cnpj; }
    public void setCnpj(String cnpj) { this.cnpj = cnpj; }
    public String getZipCode() { return zipCode; }
    public void setZipCode(String zipCode) { this.zipCode = zipCode; }
    public String getNeighborhood() { return neighborhood; }
    public void setNeighborhood(String neighborhood) { this.neighborhood = neighborhood; }
    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }
    public String getComplement() { return complement; }
    public void setComplement(String complement) { this.complement = complement; }
    public String getNumber() { return number; }
    public void setNumber(String number) { this.number = number; }
    public City getCity() { return city; }
    public void setCity(City city) { this.city = city; }
}
