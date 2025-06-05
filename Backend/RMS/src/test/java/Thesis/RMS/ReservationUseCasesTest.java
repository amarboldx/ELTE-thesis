package Thesis.RMS;

import Thesis.RMS.Application.DTO.ReservationDTO;
import Thesis.RMS.Application.DTO.ReservationResponseDTO;
import Thesis.RMS.Application.UseCases.ReservationUseCases;
import Thesis.RMS.Domain.Enums.ReservationStatus;
import Thesis.RMS.Domain.Model.Reservation;
import Thesis.RMS.Domain.Model.TableData;
import Thesis.RMS.Domain.Repository.ReservationRepository;
import Thesis.RMS.Domain.Repository.TableRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ReservationUseCasesTest {

    private ReservationRepository reservationRepository;
    private TableRepository tableRepository;
    private ReservationUseCases useCases;

    @BeforeEach
    void setUp() {
        reservationRepository = mock(ReservationRepository.class);
        tableRepository = mock(TableRepository.class);
        useCases = new ReservationUseCases(reservationRepository, tableRepository);
    }

    @Test
    void createReservation_noTimeConflict_shouldSucceed() {
        Long tableId = 1L;
        TableData table = new TableData();
        table.setId(tableId);

        LocalDateTime start = LocalDateTime.of(2025, 6, 10, 14, 0);
        LocalDateTime end = LocalDateTime.of(2025, 6, 10, 15, 0);

        ReservationDTO dto = new ReservationDTO();
        dto.setTableId(tableId);
        dto.setCustomerName("Alice");
        dto.setStartTime(start);
        dto.setEndTime(end);
        dto.setStatus(ReservationStatus.PENDING);

        when(tableRepository.findById(tableId)).thenReturn(Optional.of(table));
        when(reservationRepository.existsByTableDataAndTimeRange(table, start, end)).thenReturn(false);
        when(reservationRepository.save(any())).thenAnswer(invocation -> {
            Reservation saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        ReservationResponseDTO response = useCases.createReservation(dto);

        assertNotNull(response);
        assertEquals("Alice", response.getCustomerName());
        assertEquals(tableId, response.getTableId());
    }

    @Test
    void createReservation_withTimeConflict_shouldThrowException() {
        Long tableId = 1L;
        TableData table = new TableData();
        table.setId(tableId);

        LocalDateTime start = LocalDateTime.of(2025, 6, 10, 14, 0);
        LocalDateTime end = LocalDateTime.of(2025, 6, 10, 15, 0);

        ReservationDTO dto = new ReservationDTO();
        dto.setTableId(tableId);
        dto.setCustomerName("Bob");
        dto.setStartTime(start);
        dto.setEndTime(end);
        dto.setStatus(ReservationStatus.PENDING);

        when(tableRepository.findById(tableId)).thenReturn(Optional.of(table));
        when(reservationRepository.existsByTableDataAndTimeRange(table, start, end)).thenReturn(true);

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> useCases.createReservation(dto));

        assertEquals("Time conflict with existing reservation", exception.getMessage());
    }

    @Test
    void createReservation_withInvalidEndTime_shouldThrowException() {
        ReservationDTO dto = new ReservationDTO();
        dto.setTableId(1L);
        dto.setCustomerName("Charlie");
        dto.setStartTime(LocalDateTime.of(2025, 6, 10, 15, 0));
        dto.setEndTime(LocalDateTime.of(2025, 6, 10, 14, 0));  // Invalid
        dto.setStatus(ReservationStatus.PENDING);

        when(tableRepository.findById(1L)).thenReturn(Optional.of(new TableData()));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> useCases.createReservation(dto));

        assertEquals("End time must be after start time", exception.getMessage());
    }

    @Test
    void createReservation_withNonExistentTable_shouldThrowException() {
        ReservationDTO dto = new ReservationDTO();
        dto.setTableId(99L);
        dto.setCustomerName("Dora");
        dto.setStartTime(LocalDateTime.of(2025, 6, 10, 14, 0));
        dto.setEndTime(LocalDateTime.of(2025, 6, 10, 15, 0));
        dto.setStatus(ReservationStatus.PENDING);

        when(tableRepository.findById(99L)).thenReturn(Optional.empty());

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> useCases.createReservation(dto));

        assertEquals("Table not found", exception.getMessage());
    }
}