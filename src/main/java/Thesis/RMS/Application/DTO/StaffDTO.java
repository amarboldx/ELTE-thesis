package Thesis.RMS.Application.DTO;

import Thesis.RMS.Domain.Enums.Role;
import lombok.Data;

import java.util.List;

@Data
public class StaffDTO {
    private String name;
    private Role role;
    private List<Long> shiftIds;
    private List<Long> tableIds;
}
