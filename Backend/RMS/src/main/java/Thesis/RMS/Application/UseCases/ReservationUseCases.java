package Thesis.RMS.Application.UseCases;

import Thesis.RMS.Application.DTO.ReservationDTO;
import Thesis.RMS.Application.DTO.ReservationResponseDTO;
import Thesis.RMS.Domain.Enums.ReservationStatus;
import Thesis.RMS.Domain.Enums.TableStatus;
import Thesis.RMS.Domain.Model.Reservation;
import Thesis.RMS.Domain.Model.TableData;
import Thesis.RMS.Domain.Repository.ReservationRepository;
import Thesis.RMS.Domain.Repository.TableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor(onConstructor_ = @__(@Autowired))
public class ReservationUseCases {

    private final ReservationRepository reservationRepository;
    private final TableRepository tableDataRepository;

    public ReservationResponseDTO createReservation(ReservationDTO reservationDTO) {
        Optional<TableData> tableDataOptional = tableDataRepository.findById(reservationDTO.getTableId());
        if (tableDataOptional.isEmpty()) {
            throw new IllegalArgumentException("Table not found");
        }

        if (reservationDTO.getEndTime().isBefore(reservationDTO.getStartTime())) {
            throw new IllegalArgumentException("End time must be after start time");
        }


        boolean hasConflict = reservationRepository.existsByTableDataAndTimeRange(
                tableDataOptional.get(),
                reservationDTO.getStartTime(),
                reservationDTO.getEndTime()
        );

        if (hasConflict) {
            throw new IllegalStateException("Time conflict with existing reservation");
        }

        // 4. Create reservation
        Reservation reservation = new Reservation();
        reservation.setTableData(tableDataOptional.get());
        reservation.setCustomerName(reservationDTO.getCustomerName());
        reservation.setStartTime(reservationDTO.getStartTime());
        reservation.setEndTime(reservationDTO.getEndTime());
        reservation.setStatus(reservationDTO.getStatus());

        reservation = reservationRepository.save(reservation);
        return toReservationResponseDTO(reservation);
    }

    public List<ReservationResponseDTO> getAllReservations() {
        List<Reservation> reservations = reservationRepository.findAll();
        return reservations.stream()
                .map(this::toReservationResponseDTO)
                .collect(Collectors.toList());
    }

    public List<ReservationResponseDTO> getReservationsByStatus(ReservationStatus status) {
        return reservationRepository.findByStatus(status).stream()
                .map(this::toReservationResponseDTO)
                .collect(Collectors.toList());
    }

    public Optional<ReservationResponseDTO> getReservationById(Long id) {
        Optional<Reservation> reservation = reservationRepository.findById(id);
        return reservation.map(this::toReservationResponseDTO);
    }

    public List<ReservationResponseDTO> getReservationsByTableId(Long tableId) {
        List<Reservation> reservations = reservationRepository.findByTableId(tableId);
        return reservations.stream()
                .map(this::toReservationResponseDTO)
                .collect(Collectors.toList());
    }

    public List<ReservationResponseDTO> findByStartTimeBetween(LocalDateTime start, LocalDateTime end) {
        List<Reservation> reservations = reservationRepository.findByStartTimeBetween(start, end);
        return reservations.stream()
                .map(this::toReservationResponseDTO)
                .collect(Collectors.toList());
    }
    @Transactional
    public void deleteReservationById(Long id) {

        reservationRepository.findById(id).ifPresent(reservation -> {
            TableData table = reservation.getTableData();
            if (table != null) {
                table.setTableStatus(TableStatus.AVAILABLE);
                tableDataRepository.save(table);
            }
            reservationRepository.deleteById(id);
        });

    }

    public void updateReservationStatus(Long id, ReservationStatus status) {
        reservationRepository.findById(id).ifPresent(reservation -> {
            reservation.setStatus(status);

            if (status == ReservationStatus.CONFIRMED) {
                TableData table = reservation.getTableData();
                if (table != null) {
                    table.setTableStatus(TableStatus.RESERVED);
                    tableDataRepository.save(table);
                }
            }
            if (status == ReservationStatus.CANCELLED) {
                TableData table = reservation.getTableData();
                if (table != null) {
                    table.setTableStatus(TableStatus.AVAILABLE);
                    tableDataRepository.save(table);
                }
            }

            reservationRepository.save(reservation);
        });
    }


    private ReservationResponseDTO toReservationResponseDTO(Reservation reservation) {
        ReservationResponseDTO responseDTO = new ReservationResponseDTO();
        responseDTO.setId(reservation.getId());
        responseDTO.setTableId(reservation.getTableData().getId());
        responseDTO.setCustomerName(reservation.getCustomerName());
        responseDTO.setStartTime(reservation.getStartTime());
        responseDTO.setEndTime(reservation.getEndTime());
        responseDTO.setStatus(reservation.getStatus());
        return responseDTO;
    }
}
