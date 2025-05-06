package Thesis.RMS.Presentation;


import Thesis.RMS.Application.DTO.ShiftDTO;
import Thesis.RMS.Application.DTO.ShiftResponseDTO;
import Thesis.RMS.Application.UseCases.ShiftUseCases;
import Thesis.RMS.Domain.Enums.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("api/v1/shift")
@RequiredArgsConstructor(onConstructor_ = @__(@Autowired))
public class ShiftController {
    private final ShiftUseCases shiftUseCases;


    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @PostMapping
    public ResponseEntity<ShiftResponseDTO> createShift(@RequestBody ShiftDTO shiftDTO) {
        return ResponseEntity.ok(shiftUseCases.createShift(shiftDTO));
    }

    @Transactional
    @GetMapping
    public ResponseEntity<List<ShiftResponseDTO>> getAllShifts() {
        return ResponseEntity.ok(shiftUseCases.getAllShifts());
    }

    @Transactional
    @GetMapping("/{shiftId}")
    public ResponseEntity<Optional<ShiftResponseDTO>> getShiftById(@PathVariable Long shiftId) {
        return ResponseEntity.ok(shiftUseCases.getShiftById(shiftId));
    }

    @Transactional
    @GetMapping("/staff/{staffId}")
    public ResponseEntity<List<ShiftResponseDTO>> getShiftsByStaffId(@PathVariable Long staffId) {
        return ResponseEntity.ok(shiftUseCases.getShiftsByStaffId(staffId));
    }

    @Transactional
    @GetMapping("/time-range")
    public ResponseEntity<List<ShiftResponseDTO>> getShiftsByTimeRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return ResponseEntity.ok(shiftUseCases.getShiftsByTimeRange(start, end));
    }

    @Transactional
    @GetMapping("/role-time-range")
    public ResponseEntity<List<ShiftResponseDTO>> getShiftsByRoleAndTimeRange(
            @RequestParam LocalDateTime start,
            @RequestParam LocalDateTime end,
            @RequestParam Role role) {
        return ResponseEntity.ok(shiftUseCases.getShiftsByRoleAndTimeRange(start, end, role));
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @DeleteMapping("/{shiftId}")
    public ResponseEntity<Void> deleteShiftById(@PathVariable Long shiftId) {
        shiftUseCases.deleteShiftById(shiftId);
        return ResponseEntity.noContent().build();
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @PatchMapping("/{shiftId}")
    public ResponseEntity<ShiftResponseDTO> updateShiftDateTime(
            @PathVariable Long shiftId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime newStartTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime newEndTime) {
        return ResponseEntity.ok(shiftUseCases.updateShiftDateTime(shiftId, newStartTime, newEndTime));
    }
}
