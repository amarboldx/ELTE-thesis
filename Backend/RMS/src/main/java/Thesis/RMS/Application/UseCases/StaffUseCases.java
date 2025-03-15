package Thesis.RMS.Application.UseCases;

import Thesis.RMS.Application.DTO.StaffDTO;
import Thesis.RMS.Application.DTO.StaffResponseDTO;
import Thesis.RMS.Domain.Enums.Role;
import Thesis.RMS.Domain.Model.Staff;
import Thesis.RMS.Domain.Model.TableData;
import Thesis.RMS.Domain.Model.User;
import Thesis.RMS.Domain.Repository.StaffRepository;
import Thesis.RMS.Domain.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor(onConstructor_ = @Autowired)
public class StaffUseCases {

    private final StaffRepository staffRepository;
    private final UserRepository userRepository;

    public StaffResponseDTO createStaff(StaffDTO staffDTO) {
        UserDetails currentUserDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username = currentUserDetails.getUsername();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));

        Staff staff = new Staff();
        staff.setName(staffDTO.getName());
        staff.setRole(staffDTO.getRole());
        staff.setShifts(Collections.emptyList());
        staff.setAssignedTables(Collections.emptyList());

        staff = staffRepository.save(staff);

        staff.setUser(user);

        staff = staffRepository.save(staff);

        user.setStaff(staff);

        userRepository.save(user);

        return toStaffResponseDTO(staff);
    }

    public Optional<StaffResponseDTO> getStaffById(Long id) {
        Optional<Staff> staff = staffRepository.findById(id);
        return staff.map(this::toStaffResponseDTO);
    }


    public List<StaffResponseDTO> getAllStaff() {
        List<Staff> staffList = staffRepository.findAll();
        return staffList.stream()
                .map(this::toStaffResponseDTO)
                .collect(Collectors.toList());
    }


    public void deleteStaff(Long id) {
        staffRepository.deleteById(id);
    }


    public List<StaffResponseDTO> getStaffByRole(Role role) {
        List<Staff> staffList = staffRepository.findByRole(role);
        return staffList.stream()
                .map(this::toStaffResponseDTO)
                .collect(Collectors.toList());
    }

    public StaffResponseDTO updateStaff(Long id, StaffDTO staffDTO) {
        Staff staff = staffRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Staff with ID " + id + " not found."));
        staff.setName(staffDTO.getName());
        staff.setRole(staffDTO.getRole());
        staff = staffRepository.save(staff);

        return toStaffResponseDTO(staff);
    }

    private StaffResponseDTO toStaffResponseDTO(Staff staff) {
        StaffResponseDTO responseDTO = new StaffResponseDTO();
        responseDTO.setStaffId(staff.getStaffId());
        responseDTO.setName(staff.getName());
        responseDTO.setRole(staff.getRole());

        List<Long> shiftIds = staff.getShifts().stream()
                .map(shift -> shift.getShiftId())
                .collect(Collectors.toList());
        responseDTO.setShiftIds(shiftIds);

        List<Long> tableIds = staff.getAssignedTables().stream()
                .map(TableData::getId)
                .collect(Collectors.toList());
        responseDTO.setTableIds(tableIds);

        return responseDTO;
    }
}
