package br.com.pavi.api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "vehicle")
@JsonIgnoreProperties({"hibernateLazyInitializer"})
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "plate is required")
    private String plate;

    @NotBlank(message = "type is required")
    private String type;

    @NotBlank(message = "chassis is required")
    private String chassis;

    @NotBlank(message = "renavam is required")
    private String renavam;

    @NotNull(message = "modelYear is required")
    private Integer modelYear;

    @NotNull(message = "manufacturingYear is required")
    private Integer manufacturingYear;

    @NotNull(message = "vehicleModel is required")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vehicle_model_id")
    private VehicleModel vehicleModel;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPlate() { return plate; }
    public void setPlate(String plate) { this.plate = plate; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getChassis() { return chassis; }
    public void setChassis(String chassis) { this.chassis = chassis; }
    public String getRenavam() { return renavam; }
    public void setRenavam(String renavam) { this.renavam = renavam; }
    public Integer getModelYear() { return modelYear; }
    public void setModelYear(Integer modelYear) { this.modelYear = modelYear; }
    public Integer getManufacturingYear() { return manufacturingYear; }
    public void setManufacturingYear(Integer manufacturingYear) { this.manufacturingYear = manufacturingYear; }
    public VehicleModel getVehicleModel() { return vehicleModel; }
    public void setVehicleModel(VehicleModel vehicleModel) { this.vehicleModel = vehicleModel; }
}
