package Thesis.RMS.Domain.Repository;

import Thesis.RMS.Domain.Enums.Role;
import Thesis.RMS.Domain.Model.Shift;
import Thesis.RMS.Domain.Model.Staff;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ShiftRepository {
    Shift save(Shift shift);
    Optional<Shift> findById(Long id);
    List<Shift> findByStaffId(Long staffId);
    List<Shift> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);
    void deleteById(Long id);
    List<Shift> findAll();
    List<Shift> findByRoleAndStartTimeBetween(LocalDateTime startTime, LocalDateTime endTime, Role role);
    List<Shift> findByRole(Role role);
    List<Shift> findByName(String name);
    boolean existsByStaffAndTimeRange(Staff staff, LocalDateTime startTime, LocalDateTime endTime);
}