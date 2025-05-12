package Thesis.RMS.Presentation;

import Thesis.RMS.Application.DTO.*;
import Thesis.RMS.Application.DTO.Request.ChangePasswordRequest;
import Thesis.RMS.Application.DTO.Request.LoginRequest;
import Thesis.RMS.Application.DTO.Request.LoginResponse;
import Thesis.RMS.Application.UseCases.StaffUseCases;
import Thesis.RMS.Application.UseCases.UserService;
import Thesis.RMS.Infrastructure.Security.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final StaffUseCases staffUseCases;

    @PostMapping(value="/register", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> registerUser(@RequestBody UserDTO userDTO) {
        if (userDTO.getRole() == null) {
            return ResponseEntity.badRequest().body("A role must be specified");
        }

        if (userDTO.getRole().equals("WAITER") || userDTO.getRole().equals("CHEF") || userDTO.getRole().equals("ADMIN")) {
            if (userDTO.getUsername() == null || userDTO.getUsername().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Username is required for staff roles");
            }
        }

        return userService.registerUser(userDTO);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> authenticate(@RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            String jwt = jwtUtils.generateTokenFromUserDetails(userDetails);
            Long staffId = null;

            try {
                staffId = staffUseCases.getStaffIdByUsername(userDetails.getUsername());
            } catch (Exception e) {
            }

            return ResponseEntity.ok(new LoginResponse(
                    jwt,
                    userDetails.getUsername(),
                    convertAuthorities(userDetails),
                    staffId
            ));
        } catch (AuthenticationException e) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Invalid username/password", e);
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(
            @RequestBody ChangePasswordRequest request,
            HttpServletRequest httpRequest) {
        String token = jwtUtils.getJwtFromHeader(httpRequest);
        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or missing token");
        }

        String username = jwtUtils.getUserNameFromJwtToken(token);
        return userService.changePassword(username, request);
    }

    private String convertAuthorities(UserDetails userDetails) {
        return userDetails.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
    }
}
