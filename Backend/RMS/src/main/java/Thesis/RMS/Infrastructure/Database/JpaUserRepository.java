package Thesis.RMS.Infrastructure.Database;

import Thesis.RMS.Domain.Model.User;
import Thesis.RMS.Domain.Repository.UserRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.lang.NonNull;

import java.util.Optional;

public interface JpaUserRepository extends UserRepository, JpaRepository<User, Long> {

    @Override
    Optional<User> findByUsername(String username);

    @NonNull
    @Override
    User save(@NonNull User user);

    @NonNull
    @Override
    Optional<User> findById(@NonNull Long userId);

    @Override
    @Modifying
    @Query("DELETE FROM User u WHERE u.userId = :userId")
    void deleteById(@NonNull Long userId);


}
