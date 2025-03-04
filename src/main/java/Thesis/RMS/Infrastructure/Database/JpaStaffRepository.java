package Thesis.RMS.Infrastructure.Database;

import Thesis.RMS.Domain.Enums.Role;
import Thesis.RMS.Domain.Model.Staff;
import Thesis.RMS.Domain.Model.User;
import Thesis.RMS.Domain.Repository.StaffRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JpaStaffRepository extends JpaRepository<Staff, Long>, StaffRepository {

    @Override
    @NonNull
    Staff save(@NonNull Staff staff);

    @Override
    @NonNull
    Optional<Staff> findById(@NonNull Long staffId);

    @Override
    @NonNull
    List<Staff> findAll();

    @Override
    void deleteById(@NonNull Long staffId);

    @Override
    @NonNull
    List<Staff> findByRole(Role role);

    @Override
    Optional<Staff> findByUser(User user);

}
