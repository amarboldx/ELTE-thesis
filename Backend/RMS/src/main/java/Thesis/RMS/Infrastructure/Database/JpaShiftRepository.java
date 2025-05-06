package Thesis.RMS.Infrastructure.Database;

import Thesis.RMS.Domain.Enums.Role;
import Thesis.RMS.Domain.Model.Shift;
import Thesis.RMS.Domain.Model.Staff;
import Thesis.RMS.Domain.Repository.ShiftRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface JpaShiftRepository extends JpaRepository<Shift, Long>, ShiftRepository {

    @Override
    @NonNull
    Shift save(@NonNull Shift shift);

    @Override
    @NonNull
    Optional<Shift> findById(@NonNull Long shiftId);

    @Override
    @Query("SELECT s FROM Shift s WHERE s.staff.staffId = ?1")
    List<Shift> findByStaffId(Long staffId);

    @Override
    @Query("SELECT s FROM Shift s WHERE s.startTime BETWEEN ?1 AND ?2")
    List<Shift> findByStartTimeBetween(LocalDateTime startTime, LocalDateTime endTime);

    @Override
    @Modifying
    @Query("DELETE FROM Shift s WHERE s.shiftId = ?1")
    void deleteById(@NonNull Long id);

    @Override
    @Query("SELECT s FROM Shift s WHERE s.startTime BETWEEN ?1 AND ?2 AND s.staff.role = ?3")
    List<Shift> findByRoleAndStartTimeBetween(LocalDateTime startTime, LocalDateTime endTime, Role role);

    @Override
    @Query("SELECT s FROM Shift s WHERE s.staff.role = ?1")
    List<Shift> findByRole(Role role);

    @Override
    @Query("SELECT s FROM Shift s WHERE s.staff.name LIKE %?1%")
    List<Shift> findByName(String name);

    @Override
    @Query("SELECT COUNT(s) > 0 FROM Shift s WHERE s.staff = ?1 AND s.startTime < ?2 AND s.endTime > ?3")
    boolean existsByStaffAndTimeRange(Staff staff, LocalDateTime startTime, LocalDateTime endTime);

}
