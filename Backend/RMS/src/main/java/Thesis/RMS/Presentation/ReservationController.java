package Thesis.RMS.Presentation;


import Thesis.RMS.Application.DTO.ReservationDTO;
import Thesis.RMS.Application.DTO.ReservationResponseDTO;
import Thesis.RMS.Application.UseCases.ReservationUseCases;
import Thesis.RMS.Domain.Enums.ReservationStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("api/v1/reservations")
@RequiredArgsConstructor(onConstructor_ = @__(@Autowired))
public class ReservationController {
    private final ReservationUseCases reservationUseCases;
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @PostMapping
    public ResponseEntity<ReservationResponseDTO> createReservation(@RequestBody ReservationDTO reservationDTO) {
        return ResponseEntity.ok(reservationUseCases.createReservation(reservationDTO));
    }

    @GetMapping
    public ResponseEntity<List<ReservationResponseDTO>> getAllReservations() {
        return ResponseEntity.ok(reservationUseCases.getAllReservations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Optional<ReservationResponseDTO>> getReservationById(@PathVariable Long id) {
        return ResponseEntity.ok(reservationUseCases.getReservationById(id));
    }

    @GetMapping("/table/{tableId}")
    public ResponseEntity<List<ReservationResponseDTO>> getReservationsByTableId(@PathVariable Long tableId) {
        return ResponseEntity.ok(reservationUseCases.getReservationsByTableId(tableId));
    }

    @GetMapping("/time-range")
    public ResponseEntity<List<ReservationResponseDTO>> findByStartTimeBetween(
            @RequestParam LocalDateTime start,
            @RequestParam LocalDateTime end) {
        return ResponseEntity.ok(reservationUseCases.findByStartTimeBetween(start, end));
    }
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReservationById(@PathVariable Long id) {
        reservationUseCases.deleteReservationById(id);
        return ResponseEntity.noContent().build();
    }
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> updateReservationStatus(@PathVariable Long id, @RequestParam ReservationStatus status) {
        reservationUseCases.updateReservationStatus(id, status);
        return ResponseEntity.ok().build();
    }

}
