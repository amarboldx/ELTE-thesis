package Thesis.RMS.Presentation;


import Thesis.RMS.Application.DTO.ShiftDTO;
import Thesis.RMS.Application.DTO.ShiftResponseDTO;
import Thesis.RMS.Application.UseCases.ShiftUseCases;
import Thesis.RMS.Domain.Enums.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("api/v1/shift")
@RequiredArgsConstructor(onConstructor_ = @__(@Autowired))
public class ShiftController {
    private final ShiftUseCases shiftUseCases;

    @PostMapping
    public ResponseEntity<ShiftResponseDTO> createShift(@RequestBody ShiftDTO shiftDTO) {
        return ResponseEntity.ok(shiftUseCases.createShift(shiftDTO));
    }

    @GetMapping
    public ResponseEntity<List<ShiftResponseDTO>> getAllShifts() {
        return ResponseEntity.ok(shiftUseCases.getAllShifts());
    }

    @GetMapping("/{shiftId}")
    public ResponseEntity<Optional<ShiftResponseDTO>> getShiftById(@PathVariable Long shiftId) {
        return ResponseEntity.ok(shiftUseCases.getShiftById(shiftId));
    }

    @GetMapping("/staff/{staffId}")
    public ResponseEntity<List<ShiftResponseDTO>> getShiftsByStaffId(@PathVariable Long staffId) {
        return ResponseEntity.ok(shiftUseCases.getShiftsByStaffId(staffId));
    }

    @GetMapping("/time-range")
    public ResponseEntity<List<ShiftResponseDTO>> getShiftsByTimeRange(
            @RequestParam LocalDateTime start,
            @RequestParam LocalDateTime end) {
        return ResponseEntity.ok(shiftUseCases.getShiftsByTimeRange(start, end));
    }

    @GetMapping("/role-time-range")
    public ResponseEntity<List<ShiftResponseDTO>> getShiftsByRoleAndTimeRange(
            @RequestParam LocalDateTime start,
            @RequestParam LocalDateTime end,
            @RequestParam Role role) {
        return ResponseEntity.ok(shiftUseCases.getShiftsByRoleAndTimeRange(start, end, role));
    }

    @DeleteMapping("/{shiftId}")
    public ResponseEntity<Void> deleteShiftById(@PathVariable Long shiftId) {
        shiftUseCases.deleteShiftById(shiftId);
        return ResponseEntity.noContent().build();
    }
}
