package Thesis.RMS.Domain.Repository;

import Thesis.RMS.Domain.Model.User;

import java.util.Optional;

public interface UserRepository {
    Optional<User> findByUsername(String username);
    User save(User user);
    Optional<User> findById(Long userId);
    void deleteById(Long userId);
    boolean existsByUsername(String username);
}
