package Thesis.RMS.Domain.Repository;

import Thesis.RMS.Domain.Enums.Role;
import Thesis.RMS.Domain.Model.Staff;
import Thesis.RMS.Domain.Model.User;

import java.util.List;
import java.util.Optional;

public interface StaffRepository {
    Staff save(Staff staff);
    Optional<Staff> findById(Long id);
    List<Staff> findAll();
    void deleteById(Long id);
    List<Staff> findByRole(Role role);
    Optional<Staff> findByUser(User user);
}