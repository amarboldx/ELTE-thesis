package Thesis.RMS.Application.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String username;
    private List<String> roles;
}
