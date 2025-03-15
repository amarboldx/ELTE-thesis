package Thesis.RMS.Application.UseCases;

import Thesis.RMS.Application.DTO.ReservationDTO;
import Thesis.RMS.Application.DTO.ReservationResponseDTO;
import Thesis.RMS.Domain.Enums.ReservationStatus;
import Thesis.RMS.Domain.Model.Reservation;
import Thesis.RMS.Domain.Model.TableData;
import Thesis.RMS.Domain.Repository.ReservationRepository;
import Thesis.RMS.Domain.Repository.TableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
            throw new IllegalArgumentException("Table with ID " + reservationDTO.getTableId() + " not found.");
        }
        TableData tableData = tableDataOptional.get();

        Reservation reservation = new Reservation();
        reservation.setTableData(tableData);
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

    public void deleteReservationById(Long id) {
        reservationRepository.deleteById(id);
    }

    public void updateReservationStatus(Long id, ReservationStatus status) {
        reservationRepository.findById(id).ifPresent(reservation -> {
            reservation.setStatus(status);
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
