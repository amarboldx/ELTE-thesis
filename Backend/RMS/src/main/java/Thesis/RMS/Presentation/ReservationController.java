package Thesis.RMS.Presentation;


import Thesis.RMS.Application.DTO.ReservationDTO;
import Thesis.RMS.Application.DTO.ReservationResponseDTO;
import Thesis.RMS.Application.UseCases.ReservationUseCases;
import Thesis.RMS.Domain.Enums.ReservationStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("api/v1/reservations")
@RequiredArgsConstructor(onConstructor_ = @__(@Autowired))
public class ReservationController {
    private final ReservationUseCases reservationUseCases;

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_WAITER')")
    @PostMapping
    public ResponseEntity<ReservationResponseDTO> createReservation(@RequestBody ReservationDTO reservationDTO) {
        return ResponseEntity.ok(reservationUseCases.createReservation(reservationDTO));
    }

    @Transactional
    @GetMapping
    public ResponseEntity<List<ReservationResponseDTO>> getAllReservations() {
        return ResponseEntity.ok(reservationUseCases.getAllReservations());
    }

    @Transactional
    @GetMapping("/status")
    public ResponseEntity<List<ReservationResponseDTO>> getReservationsByStatus(
            @RequestParam ReservationStatus status) {
        List<ReservationResponseDTO> filteredReservations = reservationUseCases.getReservationsByStatus(status);
        return ResponseEntity.ok(filteredReservations);
    }

    @Transactional
    @GetMapping("/{id}")
    public ResponseEntity<Optional<ReservationResponseDTO>> getReservationById(@PathVariable Long id) {
        return ResponseEntity.ok(reservationUseCases.getReservationById(id));
    }

    @Transactional
    @GetMapping("/table/{tableId}")
    public ResponseEntity<List<ReservationResponseDTO>> getReservationsByTableId(@PathVariable Long tableId) {
        return ResponseEntity.ok(reservationUseCases.getReservationsByTableId(tableId));
    }

    @Transactional
    @GetMapping("/time-range")
    public ResponseEntity<List<ReservationResponseDTO>> findByStartTimeBetween(
            @RequestParam LocalDateTime start,
            @RequestParam LocalDateTime end) {
        return ResponseEntity.ok(reservationUseCases.findByStartTimeBetween(start, end));
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_WAITER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReservationById(@PathVariable Long id) {
        reservationUseCases.deleteReservationById(id);
        return ResponseEntity.noContent().build();
    }

    @Transactional
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_WAITER')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<Void> updateReservationStatus(@PathVariable Long id, @RequestParam ReservationStatus status) {
        reservationUseCases.updateReservationStatus(id, status);
        return ResponseEntity.ok().build();
    }

}
