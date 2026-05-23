package ro.exitusro.api.role;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ro.exitusro.api.common.enums.AppRole;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRoleEntity, UUID> {

    List<UserRoleEntity> findByUserId(UUID userId);

    Optional<UserRoleEntity> findByUserIdAndRole(UUID userId, AppRole role);

    @Query("""
            select ur.userId from UserRoleEntity ur
            where ur.role = :role
              and ur.userId in (
                select p.id from Profile p where lower(p.county) = lower(:county)
              )
            """)
    List<UUID> findUserIdsByRoleAndCounty(@Param("role") AppRole role,
                                          @Param("county") String county);

    boolean existsByUserIdAndRole(UUID userId, AppRole role);
}
