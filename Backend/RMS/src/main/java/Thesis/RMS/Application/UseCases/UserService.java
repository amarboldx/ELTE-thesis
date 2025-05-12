package Thesis.RMS.Application.UseCases;

import Thesis.RMS.Application.DTO.Request.ChangePasswordRequest;
import Thesis.RMS.Application.DTO.StaffDTO;
import Thesis.RMS.Application.DTO.UserDTO;
import Thesis.RMS.Domain.Enums.Role;
import Thesis.RMS.Domain.Model.Staff;
import Thesis.RMS.Domain.Model.User;
import Thesis.RMS.Domain.Repository.StaffRepository;
import Thesis.RMS.Domain.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final StaffRepository staffRepository;

    @Transactional
    public ResponseEntity<String> registerUser(UserDTO userDTO) {
        if (userRepository.existsByUsername(userDTO.getUsername())) {
            return ResponseEntity.badRequest().body("Username is already taken");
        }

        User newUser = new User();
        newUser.setUsername(userDTO.getUsername());
        newUser.setPassword(passwordEncoder.encode(userDTO.getPassword()));
        String role = userDTO.getRole();
        newUser.setRole(Role.valueOf(role));

        User savedUser = userRepository.save(newUser);

        if (role.equals("WAITER") ||
                role.equals("CHEF") ||
                role.equals("ADMIN")) {

            Staff staff = new Staff();
            staff.setName(userDTO.getUsername());
            staff.setRole(Role.valueOf(role));
            staff.setUser(savedUser);

            staffRepository.save(staff);

            savedUser.setStaff(staff);
            userRepository.save(savedUser);
        }

        return ResponseEntity.ok("User registered successfully");
    }

    public ResponseEntity<String> changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body("Old password is incorrect.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return ResponseEntity.ok("Password changed successfully.");
    }
}
