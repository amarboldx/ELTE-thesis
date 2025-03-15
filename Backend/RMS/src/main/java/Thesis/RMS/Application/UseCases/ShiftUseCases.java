package Thesis.RMS.Application.UseCases;

import Thesis.RMS.Application.DTO.ShiftDTO;
import Thesis.RMS.Application.DTO.ShiftResponseDTO;
import Thesis.RMS.Domain.Enums.Role;
import Thesis.RMS.Domain.Model.Shift;
import Thesis.RMS.Domain.Model.Staff;
import Thesis.RMS.Domain.Repository.ShiftRepository;
import Thesis.RMS.Domain.Repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor(onConstructor_ = @__(@Autowired))
public class ShiftUseCases {

    private final ShiftRepository shiftRepository;
    private final StaffRepository staffRepository;

    public ShiftResponseDTO createShift(ShiftDTO shiftDTO) {
        Optional<Staff> staffOptional = staffRepository.findById(shiftDTO.getStaffId());
        if (staffOptional.isEmpty()) {
            throw new IllegalArgumentException("Staff with ID " + shiftDTO.getStaffId() + " not found.");
        }
        Staff staff = staffOptional.get();

        Shift shift = new Shift();
        shift.setStaff(staff);
        shift.setStartTime(shiftDTO.getStartTime());
        shift.setEndTime(shiftDTO.getEndTime());

        shift = shiftRepository.save(shift);

        return toShiftResponseDTO(shift);
    }

    public List<ShiftResponseDTO> getAllShifts() {
        List<Shift> shifts = shiftRepository.findAll();
        return shifts.stream()
                .map(this::toShiftResponseDTO)
                .collect(Collectors.toList());
    }

    public Optional<ShiftResponseDTO> getShiftById(Long shiftId) {
        Optional<Shift> shift = shiftRepository.findById(shiftId);
        return shift.map(this::toShiftResponseDTO);
    }

    public List<ShiftResponseDTO> getShiftsByStaffId(Long staffId) {
        List<Shift> shifts = shiftRepository.findByStaffId(staffId);
        return shifts.stream()
                .map(this::toShiftResponseDTO)
                .collect(Collectors.toList());
    }

    public List<ShiftResponseDTO> getShiftsByTimeRange(LocalDateTime start, LocalDateTime end) {
        List<Shift> shifts = shiftRepository.findByStartTimeBetween(start, end);
        return shifts.stream()
                .map(this::toShiftResponseDTO)
                .collect(Collectors.toList());
    }

    public List<ShiftResponseDTO> getShiftsByRoleAndTimeRange(LocalDateTime start, LocalDateTime end, Role role) {
        List<Shift> shifts = shiftRepository.findByRoleAndStartTimeBetween(start, end, role);
        return shifts.stream()
                .map(this::toShiftResponseDTO)
                .collect(Collectors.toList());
    }


    public void deleteShiftById(Long shiftId) {
        shiftRepository.deleteById(shiftId);
    }


    private ShiftResponseDTO toShiftResponseDTO(Shift shift) {
        ShiftResponseDTO responseDTO = new ShiftResponseDTO();
        responseDTO.setShiftId(shift.getShiftId());
        responseDTO.setStaffId(shift.getStaff().getStaffId());
        responseDTO.setStartTime(shift.getStartTime());
        responseDTO.setEndTime(shift.getEndTime());
        return responseDTO;
    }
}
