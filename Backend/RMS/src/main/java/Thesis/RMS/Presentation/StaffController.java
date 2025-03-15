package Thesis.RMS.Presentation;


import Thesis.RMS.Application.DTO.StaffDTO;
import Thesis.RMS.Application.DTO.StaffResponseDTO;
import Thesis.RMS.Application.UseCases.StaffUseCases;
import Thesis.RMS.Domain.Enums.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("api/v1/staff")
@RequiredArgsConstructor(onConstructor_ = @__(@Autowired))
public class StaffController {
    private final StaffUseCases staffUseCases;

    @PostMapping
    public ResponseEntity<StaffResponseDTO> createStaff(@RequestBody StaffDTO staffDTO) {
        return ResponseEntity.ok(staffUseCases.createStaff(staffDTO));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Optional<StaffResponseDTO>> getStaffById(@PathVariable Long id) {
        return ResponseEntity.ok(staffUseCases.getStaffById(id));
    }

    @GetMapping
    public ResponseEntity<List<StaffResponseDTO>> getAllStaff() {
        return ResponseEntity.ok(staffUseCases.getAllStaff());
    }

    @GetMapping("/role")
    public ResponseEntity<List<StaffResponseDTO>> getStaffByRole(@RequestParam Role role) {
        return ResponseEntity.ok(staffUseCases.getStaffByRole(role));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StaffResponseDTO> updateStaff(@PathVariable Long id, @RequestBody StaffDTO staffDTO) {
        return ResponseEntity.ok(staffUseCases.updateStaff(id, staffDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStaff(@PathVariable Long id) {
        staffUseCases.deleteStaff(id);
        return ResponseEntity.noContent().build();
    }
}
