package Thesis.RMS;

import Thesis.RMS.Application.DTO.ShiftDTO;
import Thesis.RMS.Application.DTO.ShiftResponseDTO;
import Thesis.RMS.Application.UseCases.ShiftUseCases;
import Thesis.RMS.Domain.Model.Shift;
import Thesis.RMS.Domain.Model.Staff;
import Thesis.RMS.Domain.Repository.ShiftRepository;
import Thesis.RMS.Domain.Repository.StaffRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ShiftUseCasesTest {

    private ShiftRepository shiftRepository;
    private StaffRepository staffRepository;
    private ShiftUseCases shiftUseCases;

    @BeforeEach
    void setUp() {
        shiftRepository = mock(ShiftRepository.class);
        staffRepository = mock(StaffRepository.class);
        shiftUseCases = new ShiftUseCases(shiftRepository, staffRepository);
    }

    @Test
    void createShift_validInput_shouldCreateShift() {
        Long staffId = 1L;
        LocalDateTime start = LocalDateTime.of(2025, 6, 5, 10, 0);
        LocalDateTime end = LocalDateTime.of(2025, 6, 5, 12, 0);

        Staff staff = new Staff();
        staff.setStaffId(staffId);

        ShiftDTO dto = new ShiftDTO();
        dto.setStaffId(staffId);
        dto.setStartTime(start);
        dto.setEndTime(end);

        when(staffRepository.findById(staffId)).thenReturn(Optional.of(staff));
        when(shiftRepository.existsByStaffAndTimeRange(staff, start, end)).thenReturn(false);
        when(shiftRepository.save(any())).thenAnswer(invocation -> {
            Shift saved = invocation.getArgument(0);
            saved.setShiftId(100L);
            return saved;
        });

        ShiftResponseDTO response = shiftUseCases.createShift(dto);

        assertNotNull(response);
        assertEquals(staffId, response.getStaffId());
        assertEquals(start, response.getStartTime());
        assertEquals(end, response.getEndTime());
    }

    @Test
    void createShift_nonExistentStaff_shouldThrow() {
        when(staffRepository.findById(999L)).thenReturn(Optional.empty());

        ShiftDTO dto = new ShiftDTO();
        dto.setStaffId(999L);
        dto.setStartTime(LocalDateTime.now());
        dto.setEndTime(LocalDateTime.now().plusHours(2));

        Exception ex = assertThrows(IllegalArgumentException.class, () -> shiftUseCases.createShift(dto));
        assertEquals("Staff with ID 999 not found.", ex.getMessage());
    }

    @Test
    void createShift_endBeforeStart_shouldThrow() {
        Staff staff = new Staff();
        staff.setStaffId(1L);

        LocalDateTime start = LocalDateTime.of(2025, 6, 5, 14, 0);
        LocalDateTime end = LocalDateTime.of(2025, 6, 5, 12, 0);

        when(staffRepository.findById(1L)).thenReturn(Optional.of(staff));

        ShiftDTO dto = new ShiftDTO();
        dto.setStaffId(1L);
        dto.setStartTime(start);
        dto.setEndTime(end);

        Exception ex = assertThrows(IllegalArgumentException.class, () -> shiftUseCases.createShift(dto));
        assertEquals("End time must be after start time", ex.getMessage());
    }

    @Test
    void createShift_lessThanOneHour_shouldThrow() {
        Staff staff = new Staff();
        staff.setStaffId(2L);

        LocalDateTime start = LocalDateTime.of(2025, 6, 5, 10, 0);
        LocalDateTime end = LocalDateTime.of(2025, 6, 5, 10, 30);

        when(staffRepository.findById(2L)).thenReturn(Optional.of(staff));

        ShiftDTO dto = new ShiftDTO();
        dto.setStaffId(2L);
        dto.setStartTime(start);
        dto.setEndTime(end);

        Exception ex = assertThrows(IllegalArgumentException.class, () -> shiftUseCases.createShift(dto));
        assertEquals("Shift must be at least 1 hour long", ex.getMessage());
    }

    @Test
    void createShift_timeConflict_shouldThrow() {
        Staff staff = new Staff();
        staff.setStaffId(3L);

        LocalDateTime start = LocalDateTime.of(2025, 6, 5, 10, 0);
        LocalDateTime end = LocalDateTime.of(2025, 6, 5, 12, 0);

        when(staffRepository.findById(3L)).thenReturn(Optional.of(staff));
        when(shiftRepository.existsByStaffAndTimeRange(staff, start, end)).thenReturn(true);

        ShiftDTO dto = new ShiftDTO();
        dto.setStaffId(3L);
        dto.setStartTime(start);
        dto.setEndTime(end);

        Exception ex = assertThrows(IllegalStateException.class, () -> shiftUseCases.createShift(dto));
        assertEquals("Staff already has a shift during this time", ex.getMessage());
    }
}
