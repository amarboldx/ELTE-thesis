package Thesis.RMS.Application.DTO.Request;

import Thesis.RMS.Domain.Enums.Allergen_List;
import lombok.Data;

import java.util.List;

@Data
public class CreateItemRequest {
    private String name;
    private String description;
    private double price;
    private List<Allergen_List> allergens;

}